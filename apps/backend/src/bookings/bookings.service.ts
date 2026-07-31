import { randomUUID } from 'crypto';

import { ConflictException, ForbiddenException, GoneException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Transactional } from 'typeorm-transactional';

import { Ticket } from '../events/entities/ticket.entity';
import { DEFAULT_RESERVATION_TTL_SECONDS, RedisKey, RedisValue } from '../common/redis/redis.keys';
import { RedisService } from '../common/redis/redis.service';

import {
  BookingConfirmationDto,
  CancelReservationDto,
  ConfirmBookingDto,
  CreateReservationDto,
  ReservationDto,
} from './dto/booking.dto';
import { Booking } from './entities/booking.entity';
import { PaymentService } from '../payments/payment.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    private readonly redisService: RedisService,
    private readonly paymentService: PaymentService,
  ) {}

  async createReservation(dto: CreateReservationDto): Promise<ReservationDto> {
    // Fast-fail: reject if any ticket is already booked in the DB.
    // This is a UX optimization, not a correctness guarantee — a booking could be inserted
    // between this check and the SETNX below. Correctness is enforced by the UNIQUE constraint
    // on booking.ticket_id and the NOT EXISTS guard in confirmBooking.
    const alreadyBooked = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.ticketId IN (:...ids)', { ids: dto.ticketIds })
      .getCount();

    if (alreadyBooked > 0) throw new ConflictException('One or more tickets are already booked');

    // All tickets in this reservation share the same reservationToken and expiresAt.
    // Each ticket gets its own Redis key (ticket:reserved:{ticketId}) but the stored value is identical.
    // This means the token alone is sufficient to verify ownership across the entire group —
    // cancel and confirm use it as the single proof of ownership rather than checking per-ticket userId.
    const reservationToken = randomUUID();
    const expiresAt = new Date(Date.now() + DEFAULT_RESERVATION_TTL_SECONDS * 1000).toISOString();
    const value = RedisValue.ticketReserved(dto.userId, reservationToken, expiresAt);
    const keys = dto.ticketIds.map(RedisKey.ticketReserved);

    // Atomic all-or-nothing: Lua returns [] on success, or the conflicting values if any key existed.
    const conflicts = await this.redisService.setNxMany(keys, value);
    if (conflicts.length > 0) {
      // Idempotency: if every conflict belongs to this user, return their existing hold with remaining TTL.
      // Covers client retries and duplicate requests — the caller gets the same shape back as a fresh reserve.
      const allOwnedByUser = conflicts.every((v) => RedisValue.parseTicketReserved(v).userId === dto.userId);
      if (!allOwnedByUser) throw new ConflictException('One or more tickets are already reserved');

      // expiresAt is embedded in the stored value — no extra Redis round-trip needed
      const {
        reservationToken: existingToken,
        expiresAt: existingExpiresAt,
        userId,
      } = RedisValue.parseTicketReserved(conflicts[0]);
      return { reservationToken: existingToken, userId, ticketIds: dto.ticketIds, expiresAt: existingExpiresAt };
    }

    return { reservationToken, userId: dto.userId, ticketIds: dto.ticketIds, expiresAt };
  }

  async cancelReservation(reservationToken: string, dto: CancelReservationDto): Promise<void> {
    const ticketKeys = dto.ticketIds.map(RedisKey.ticketReserved);
    const storedValues = await this.redisService.mget(ticketKeys);

    // The token proves which tickets are held; userId proves the caller owns them.
    // Both must match — token-only is insufficient because a leaked token could be used by anyone.
    const keysToDelete = ticketKeys.filter((_, i) => {
      const stored = storedValues[i];
      if (!stored) return false;
      const parsed = RedisValue.parseTicketReserved(stored);
      return parsed.reservationToken === reservationToken && parsed.userId === dto.userId;
    });

    if (keysToDelete.length > 0) await this.redisService.del(...keysToDelete);
  }

  @Transactional()
  async confirmBooking(reservationToken: string, dto: ConfirmBookingDto): Promise<BookingConfirmationDto> {
    // Step 1: Validate Redis ownership — the token is the proof; userId is read from the stored value.
    const ticketKeys = dto.ticketIds.map(RedisKey.ticketReserved);
    const storedValues = await this.redisService.mget(ticketKeys);

    if (storedValues.some((s) => s === null)) throw new GoneException('Reservation has expired — please reserve again');

    const parsed = storedValues.map((s) => RedisValue.parseTicketReserved(s!));

    // Token proves which tickets are held; userId proves the caller owns them.
    // Both must match — a leaked token alone is not sufficient to confirm or cancel.
    if (parsed.some((p) => p.reservationToken !== reservationToken || p.userId !== dto.userId))
      throw new ForbiddenException('Reservation token or userId does not match');

    const { userId } = parsed[0];

    // Step 2: SELECT FOR UPDATE SKIP LOCKED + NOT EXISTS guard
    // SKIP LOCKED: if another transaction is mid-confirm on the same ticket, skip it (returns fewer rows → 409)
    // NOT EXISTS: catches tickets already booked in a prior transaction (Redis TTL lagged behind DB)
    const tickets = await this.bookingRepository.manager
      .createQueryBuilder(Ticket, 'ticket')
      .where('ticket.id IN (:...ids)', { ids: dto.ticketIds })
      .andWhere('NOT EXISTS (SELECT 1 FROM booking b WHERE b.ticket_id = ticket.id)')
      .setLock('pessimistic_write') // FOR UPDATE — waits for any concurrent confirm to finish, then NOT EXISTS catches the duplicate
      .getMany();

    if (tickets.length !== dto.ticketIds.length)
      throw new ConflictException('One or more tickets are already booked or currently being processed');

    try {
      // Step 3: INSERT booking rows first, then charge.
      // @Transactional() wraps the entire method — if executePayment() throws,
      // the transaction rolls back and these booking rows are never committed.
      const bookings: Booking[] = this.bookingRepository.create(
        tickets.map((ticket) => ({ userId, ticketId: ticket.id })),
      );
      await this.saveBookings(bookings);

      // Step 4: Charge the total across all bookings — when this throws, the transaction
      // fails and all booking rows roll back automatically (@Transactional).
      // One PaymentRecord row is written per booking on success.
      const { transactionId } = await this.paymentService.executePayment(
        // Build a price map from tickets
        tickets.map((ticket, i) => ({ id: bookings[i].id, priceCents: ticket.priceCents })),
        userId,
        dto.payment,
      );

      return {
        bookingIds: bookings.map((b) => b.id),
        transactionId,
        reservationToken,
        ticketIds: dto.ticketIds,
        userId,
        email: dto.email,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
      };
    } finally {
      // `finally` always executes — whether the try block returned or threw.
      // Critically, it does NOT swallow errors: if executePayment() threw, that error
      // continues propagating to the caller after this block completes.
      // The only footgun: if this block itself throws, it replaces the original error —
      // so keep finally side-effect-only (no business logic, just cleanup).
      await this.redisService.del(...ticketKeys);
    }
  }

  // Wraps repository.save and translates a unique constraint violation (PG 23505) into a
  // meaningful 409 so the caller knows a duplicate booking was attempted, not a server crash.
  private async saveBookings(bookings: Booking[]): Promise<Booking[]> {
    try {
      return await this.bookingRepository.save(bookings);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === '23505')
        throw new ConflictException('One or more tickets are already booked');
      throw err;
    }
  }
}

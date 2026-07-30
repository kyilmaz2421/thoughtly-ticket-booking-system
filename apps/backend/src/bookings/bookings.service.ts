import { randomUUID } from 'crypto';

import { ConflictException, ForbiddenException, GoneException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { Ticket } from '../events/entities/ticket.entity';
import { DEFAULT_RESERVATION_TTL_SECONDS, RedisKey, RedisValue } from '../redis/redis.keys';
import { RedisService } from '../redis/redis.service';

import { BookingConfirmationDto, ConfirmBookingDto, CreateReservationDto, ReservationDto } from './dto/booking.dto';
import { Booking, PaymentStatus } from './entities/booking.entity';
import { PaymentService } from './payment.service';

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

  @Transactional()
  async confirmBooking(reservationToken: string, dto: ConfirmBookingDto): Promise<BookingConfirmationDto> {
    // Step 1: Validate Redis ownership — every key must exist and belong to this user+token
    const ticketKeys = dto.ticketIds.map(RedisKey.ticketReserved);
    const storedValues = await Promise.all(ticketKeys.map((k) => this.redisService.get(k)));

    for (const stored of storedValues) {
      if (stored === null) throw new GoneException('Reservation has expired — please reserve again');
      const { userId, reservationToken: storedToken } = RedisValue.parseTicketReserved(stored);
      if (userId !== dto.userId || storedToken !== reservationToken)
        throw new ForbiddenException('Reservation does not belong to this user');
    }

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
      // Step 3: Charge then INSERT — finally releases the Redis hold in all outcomes.
      // On failure: payment throws, INSERT is never reached, transaction rolls back, hold is freed.
      // On success: INSERT commits, hold is freed.
      const { transactionId } = await this.paymentService.executePayment();

      // Step 4: INSERT one booking row per ticket — only reached on payment success
      const bookings: Booking[] = this.bookingRepository.create(
        tickets.map((ticket) => ({
          userId: dto.userId,
          ticketId: ticket.id,
          paymentStatus: PaymentStatus.SUCCESS,
        })),
      );
      await this.bookingRepository.save(bookings);
      return {
        bookingIds: bookings.map((b) => b.id),
        transactionId,
        reservationToken,
        ticketIds: dto.ticketIds,
        userId: dto.userId,
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
}

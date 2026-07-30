import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { paginate } from '../common/db/paginate.util';
import { RedisKey } from '../redis/redis.keys';
import { RedisService } from '../redis/redis.service';

import { EventDetailDto, EventSummaryDto, PaginatedEventsDto } from './dto/event.dto';
import { PaginatedTicketsDto, TicketDto } from './dto/ticket.dto';
import { Event } from './entities/event.entity';
import { Ticket, TicketSection } from './entities/ticket.entity';

const DEFAULT_LIMIT = 10;

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly redisService: RedisService,
  ) {}

  async findAll(cursor?: string, limit = DEFAULT_LIMIT): Promise<PaginatedEventsDto> {
    const take = limit + 1;
    // TODO: sort order could be controlled by UI (e.g. ?sort=name or ?sort=eventType)
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .innerJoinAndSelect('event.venue', 'venue')
      .orderBy('event.startDatetime', 'ASC')
      .addOrderBy('event.eventType', 'ASC')
      .addOrderBy('event.name', 'ASC')
      .addOrderBy('event.id', 'ASC')
      .take(take);

    if (cursor) {
      const { startDatetime, eventType, name, id } = PaginatedEventsDto.decodeCursor(cursor);
      qb.andWhere(
        `(
          event.startDatetime > :startDatetime OR
          (event.startDatetime = :startDatetime AND event.eventType > :eventType) OR
          (event.startDatetime = :startDatetime AND event.eventType = :eventType AND event.name > :name) OR
          (event.startDatetime = :startDatetime AND event.eventType = :eventType AND event.name = :name AND event.id > :id)
        )`,
        { startDatetime, eventType, name, id },
      );
    }

    const { page, hasMore, nextCursor } = paginate(await qb.getMany(), take, (last) =>
      PaginatedEventsDto.encodeCursor({
        startDatetime: last.startDatetime.toISOString(),
        eventType: last.eventType,
        name: last.name,
        id: last.id,
      }),
    );

    return { data: page.map(EventSummaryDto.from), nextCursor, hasMore };
  }

  async findOne(id: string): Promise<EventDetailDto> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { venue: true, eventHost: true },
    });
    if (!event) throw new NotFoundException(`Event ${id} not found`);

    return EventDetailDto.from(event);
  }

  async findTickets(
    eventId: string,
    section?: TicketSection,
    cursor?: string,
    limit = DEFAULT_LIMIT,
  ): Promise<PaginatedTicketsDto> {
    const take = limit + 1;
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.eventId = :eventId', { eventId })
      .andWhere('NOT EXISTS (SELECT 1 FROM booking b WHERE b.ticket_id = ticket.id)')
      .orderBy('ticket.section', 'ASC')
      .addOrderBy('ticket.seatNumber', 'ASC')
      .take(take);

    if (section) {
      qb.andWhere('ticket.section = :section', { section });
    }

    if (cursor) {
      const { seatNumber, section: cursorSection } = PaginatedTicketsDto.decodeCursor(cursor);
      qb.andWhere(
        '(ticket.section > :cursorSection OR (ticket.section = :cursorSection AND ticket.seatNumber > :seatNumber))',
        { cursorSection, seatNumber },
      );
    }

    const dbTickets = await qb.getMany();

    // Single MGET round-trip instead of N individual GETs.
    // We check all returned rows (including the +1 lookahead) so pagination counts stay correct.
    const heldFlags = await this.redisService.mget(
      dbTickets.map((t) => RedisKey.ticketReserved(t.id)),
    );
    const available = dbTickets.filter((_, i) => heldFlags[i] === null);

    const { page, hasMore, nextCursor } = paginate(available, take, (last) =>
      PaginatedTicketsDto.encodeCursor({ section: last.section, seatNumber: last.seatNumber }),
    );

    return { data: page.map(TicketDto.from), nextCursor, hasMore };
  }
}

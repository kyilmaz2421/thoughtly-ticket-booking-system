import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { paginate } from '../common/db/paginate.util'; // still used by findAll
import { RedisKey, RedisValue } from '../common/redis/redis.keys';
import { RedisService } from '../common/redis/redis.service';

import { EventDetailDto, EventSummaryDto, PaginatedEventsDto, TicketsQueryDto } from './dto/event.dto';
import { PaginatedTicketsDto, TicketDto } from './dto/ticket.dto';
import { Event } from './entities/event.entity';
import { Ticket } from './entities/ticket.entity';

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

  async findTickets(eventId: string, query: TicketsQueryDto): Promise<PaginatedTicketsDto> {
    const { section, cursor, limit = DEFAULT_LIMIT, userId, quantity = 1 } = query;
    // Over-fetch so we have enough raw tickets to form limit+1 complete groups
    // even after skipping tickets that break consecutive runs.
    const take = (limit + 1) * quantity * 2;
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.eventId = :eventId', { eventId })
      .andWhere('NOT EXISTS (SELECT 1 FROM booking b WHERE b.ticket_id = ticket.id)')
      .orderBy('ticket.section', 'ASC')
      .addOrderBy('ticket.seatNumber', 'ASC')
      .take(take);

    if (section) qb.andWhere('ticket.section = :section', { section });

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
    const reservedTickets = await this.redisService.mget(dbTickets.map((t) => RedisKey.ticketReserved(t.id)));
    const heldByMeMap = new Map<string, string>(); // ticketId → expiresAt
    const available = dbTickets.filter((ticket, i) => {
      const val = reservedTickets[i];
      if (val === null) return true;
      if (userId !== undefined && RedisValue.parseTicketReserved(val).userId === userId) {
        heldByMeMap.set(ticket.id, RedisValue.parseTicketReserved(val).expiresAt);
        return true;
      }
      return false;
    });

    const groups = this.groupConsecutive(available, quantity, limit + 1);

    const hasMore = groups.length > limit;
    const page = hasMore ? groups.slice(0, limit) : groups;
    const lastGroup = page[page.length - 1];
    const nextCursor =
      hasMore && lastGroup
        ? PaginatedTicketsDto.encodeCursor({
            section: lastGroup[lastGroup.length - 1].section,
            seatNumber: lastGroup[lastGroup.length - 1].seatNumber,
          })
        : null;

    const data = page.flatMap((group, groupIndex) =>
      group.map((ticket) =>
        TicketDto.from(ticket, groupIndex + 1, heldByMeMap.has(ticket.id), heldByMeMap.get(ticket.id)),
      ),
    );

    return { data, nextCursor, hasMore };
  }

  // Returns up to `maxGroups` groups of exactly `quantity` consecutive same-section
  // adjacent-seat tickets. When a run breaks early, skip ticket i and retry from i+1.
  private groupConsecutive(tickets: Ticket[], quantity: number, maxGroups: number): Ticket[][] {
    const groups: Ticket[][] = [];
    let i = 0;
    while (i < tickets.length && groups.length < maxGroups) {
      let j = i + 1;
      while (
        j < tickets.length &&
        j - i < quantity &&
        tickets[j].section === tickets[i].section &&
        tickets[j].seatNumber === tickets[i].seatNumber + (j - i)
      )
        j++;

      if (j - i === quantity) {
        groups.push(tickets.slice(i, j));
        i = j;
      } else i++;
    }
    return groups;
  }
}

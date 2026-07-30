import { decodeCursor, encodeCursor } from '../../common/db/paginate.util';
import { BaseDto } from '../../common/dto/base.dto';
import { Ticket, TicketSection } from '../entities/ticket.entity';

export class TicketDto extends BaseDto {
  id: string;
  eventId: string;
  section: TicketSection;
  seatNumber: number;
  priceCents: number;
  priceDisplay: string;

  static from(this: void, ticket: Ticket): TicketDto {
    return {
      id: ticket.id,
      eventId: ticket.eventId,
      section: ticket.section,
      seatNumber: ticket.seatNumber,
      priceCents: ticket.priceCents,
      priceDisplay: `$${(ticket.priceCents / 100).toFixed(2)}`,
      createdAt: ticket.createdAt.toISOString(),
    };
  }
}

export interface TicketCursor {
  section: string;
  seatNumber: number;
}

export class PaginatedTicketsDto {
  data: TicketDto[];
  nextCursor: string | null;
  hasMore: boolean;

  static encodeCursor(cursor: TicketCursor): string {
    return encodeCursor(cursor);
  }

  static decodeCursor(token: string): TicketCursor {
    return decodeCursor<TicketCursor>(token);
  }
}

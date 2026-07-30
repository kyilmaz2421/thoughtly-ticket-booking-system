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
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  static decodeCursor(token: string): TicketCursor {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as TicketCursor;
  }
}

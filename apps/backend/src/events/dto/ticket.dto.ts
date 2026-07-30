import { BaseDto } from '../../common/dto/base.dto';
import { TicketSection } from '../entities/ticket.entity';

export class TicketDto extends BaseDto {
  id: string;
  eventId: string;
  section: TicketSection;
  seatNumber: number;
  priceCents: number;
  priceDisplay: string;
}

export class PaginatedTicketsDto {
  data: TicketDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { BaseDto } from '../../common/dto/base.dto';
import { EventHostDto } from '../../hosts/dto/event-host.dto';
import { VenueDetailDto, VenueSummaryDto } from '../../venues/dto/venue.dto';
import { EventType } from '../entities/event.entity';
import { TicketSection } from '../entities/ticket.entity';

// ---------------------------------------------------------------------------
// Query DTOs — validated and transformed by the global ValidationPipe
// ---------------------------------------------------------------------------

export class EventsQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class TicketsQueryDto {
  @IsOptional()
  @IsEnum(TicketSection)
  section?: TicketSection;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export class EventSummaryDto extends BaseDto {
  id: string;
  name: string;
  description: string;
  startDatetime: string;
  endDatetime: string;
  eventType: EventType;
  venue: VenueSummaryDto;
}

export class EventDetailDto extends EventSummaryDto {
  venue: VenueDetailDto;
  eventHost: EventHostDto;
}

export class PaginatedEventsDto {
  data: EventSummaryDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

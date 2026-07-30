import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { BaseDto } from '../../common/dto/base.dto';
import { EventHostDto } from '../../hosts/dto/event-host.dto';
import { VenueDetailDto, VenueSummaryDto } from '../../venues/dto/venue.dto';
import { Event, EventType } from '../entities/event.entity';
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

  static from(this: void, event: Event): EventSummaryDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      startDatetime: event.startDatetime.toISOString(),
      endDatetime: event.endDatetime.toISOString(),
      eventType: event.eventType,
      venue: VenueSummaryDto.from(event.venue),
      createdAt: event.createdAt.toISOString(),
    };
  }
}

export class EventDetailDto extends EventSummaryDto {
  venue: VenueDetailDto;
  eventHost: EventHostDto;

  static from(event: Event): EventDetailDto {
    return {
      ...EventSummaryDto.from(event),
      venue: VenueDetailDto.from(event.venue),
      eventHost: EventHostDto.from(event.eventHost),
    };
  }
}

export interface EventCursor {
  startDatetime: string;
  eventType: string;
  name: string;
  id: string;
}

export class PaginatedEventsDto {
  data: EventSummaryDto[];
  nextCursor: string | null;
  hasMore: boolean;

  static encodeCursor(cursor: EventCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  static decodeCursor(token: string): EventCursor {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as EventCursor;
  }
}

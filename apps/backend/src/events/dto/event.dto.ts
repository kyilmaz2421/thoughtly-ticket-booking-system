import { BaseDto } from '../../common/dto/base.dto';
import { EventHostDto } from '../../hosts/dto/event-host.dto';
import { VenueDetailDto, VenueSummaryDto } from '../../venues/dto/venue.dto';
import { EventType } from '../entities/event.entity';

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

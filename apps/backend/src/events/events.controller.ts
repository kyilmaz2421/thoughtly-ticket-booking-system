import { Controller, Get, Param, Query } from '@nestjs/common';

import { EventDetailDto, EventsQueryDto, PaginatedEventsDto, TicketsQueryDto } from './dto/event.dto';
import { PaginatedTicketsDto } from './dto/ticket.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(@Query() query: EventsQueryDto): Promise<PaginatedEventsDto> {
    return this.eventsService.findAll(query.cursor, query.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EventDetailDto> {
    return this.eventsService.findOne(id);
  }

  @Get(':id/tickets')
  findTickets(@Param('id') eventId: string, @Query() query: TicketsQueryDto): Promise<PaginatedTicketsDto> {
    return this.eventsService.findTickets(eventId, query);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HostsModule } from '../hosts/hosts.module';
import { RedisModule } from '../redis/redis.module';
import { VenuesModule } from '../venues/venues.module';

import { Event } from './entities/event.entity';
import { Ticket } from './entities/ticket.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Ticket]), VenuesModule, HostsModule, RedisModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}

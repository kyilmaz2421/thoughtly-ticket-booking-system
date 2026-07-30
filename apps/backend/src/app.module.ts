import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/common/db/data-source';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookingsModule } from './bookings/bookings.module';
import { EventsModule } from './events/events.module';
import { HostsModule } from './hosts/hosts.module';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    EventsModule,
    BookingsModule,
    VenuesModule,
    UsersModule,
    HostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

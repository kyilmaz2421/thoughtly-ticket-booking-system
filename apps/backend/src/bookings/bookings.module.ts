import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';

import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { PaymentService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), EventsModule, UsersModule, RedisModule],
  controllers: [BookingsController],
  providers: [BookingsService, PaymentService],
  exports: [BookingsService],
})
export class BookingsModule {}

import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { BookingsService } from './bookings.service';
import { BookingConfirmationDto, ConfirmBookingDto, CreateReservationDto, ReservationDto } from './dto/booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('reservations')
  createReservation(@Body() dto: CreateReservationDto): Promise<ReservationDto> {
    return this.bookingsService.createReservation(dto);
  }

  @Post('reservations/:reservationToken/confirm')
  confirmBooking(
    @Param('reservationToken', ParseUUIDPipe) reservationToken: string,
    @Body() dto: ConfirmBookingDto,
  ): Promise<BookingConfirmationDto> {
    return this.bookingsService.confirmBooking(reservationToken, dto);
  }
}

import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { BookingsService } from './bookings.service';
import { BookingConfirmationDto, CancelReservationDto, ConfirmBookingDto, CreateReservationDto, ReservationDto } from './dto/booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('reservations')
  createReservation(@Body() dto: CreateReservationDto): Promise<ReservationDto> {
    return this.bookingsService.createReservation(dto);
  }

  @Delete('reservations/:reservationToken')
  @HttpCode(204)
  cancelReservation(
    @Param('reservationToken', ParseUUIDPipe) reservationToken: string,
    @Body() dto: CancelReservationDto,
  ): Promise<void> {
    return this.bookingsService.cancelReservation(reservationToken, dto);
  }

  @Post('reservations/:reservationToken/confirm')
  confirmBooking(
    @Param('reservationToken', ParseUUIDPipe) reservationToken: string,
    @Body() dto: ConfirmBookingDto,
  ): Promise<BookingConfirmationDto> {
    return this.bookingsService.confirmBooking(reservationToken, dto);
  }
}

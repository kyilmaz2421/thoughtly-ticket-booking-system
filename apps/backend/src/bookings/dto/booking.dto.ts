import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

// ---------------------------------------------------------------------------
// POST /bookings/reservations — create a Redis-backed hold (no DB write)
// ---------------------------------------------------------------------------

export class CreateReservationDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ticketIds: string[];
}

export class ReservationDto {
  // Identifies the Redis reservation record — NOT a DB booking ID.
  // Expires after the hold window; never persisted to the booking table.
  reservationToken: string;
  userId: string;
  ticketIds: string[];
  expiresAt: string; // ISO — client uses this to drive the countdown timer
}

// ---------------------------------------------------------------------------
// POST /bookings/reservations/:reservationId/confirm — charge + write DB
// ---------------------------------------------------------------------------

export class PaymentDto {
  @IsString()
  @Matches(/^\d{13,19}$/, { message: 'cardNumber must be 13–19 digits with no spaces' })
  cardNumber: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'expiry must be MM/YY' })
  expiry: string;

  @IsString()
  @MinLength(3)
  @MaxLength(4)
  @Matches(/^\d{3,4}$/, { message: 'cvv must be 3 or 4 digits' })
  cvv: string;
}

export class ConfirmBookingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ticketIds: string[];

  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => PaymentDto)
  payment: PaymentDto;
}

export class CancelReservationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ticketIds: string[];
}

export class BookingConfirmationDto {
  bookingIds: string[]; // one DB row per ticket — only exist after successful confirm
  transactionId: string; // opaque ID returned by the payment processor
  reservationToken: string;
  ticketIds: string[];
  userId: string;
  email: string;
  status: 'confirmed';
  confirmedAt: string;
}

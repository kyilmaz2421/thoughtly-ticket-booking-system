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
  // This is mimicking calling user's userId that would normally be deerived from jwt
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

  @IsString()
  @MinLength(3)
  @MaxLength(10)
  postalCode: string;
}

export class ConfirmBookingDto {
  // userId is required it is meant to mimick the userId derived from JWT auth
  // userId proves that they are dealing with their own reservation and not someone elses
  // Without userId, anyone who obtains a leaked token can confirm/cancel someone else's reservation
  @IsUUID()
  userId: string;

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
  // Same reasoning as ConfirmBookingDto.userId — token alone is not sufficient proof of identity.
  @IsUUID()
  userId: string;

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

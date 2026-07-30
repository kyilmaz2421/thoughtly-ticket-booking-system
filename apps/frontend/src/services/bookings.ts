import { apiFetch } from "./api-client";

// ---------------------------------------------------------------------------
// Request / Response types — mirror backend DTOs
// ---------------------------------------------------------------------------

export interface CreateReservationRequest {
  userId: string;
  ticketIds: string[];
}

export interface Reservation {
  reservationToken: string;
  userId: string;
  ticketIds: string[];
  expiresAt: string; // ISO — drives the countdown timer
}

export interface CancelReservationRequest {
  ticketIds: string[];
}

export interface ConfirmBookingRequest {
  ticketIds: string[];
  email: string;
  payment: { cardNumber: string; expiry: string; cvv: string };
}

export interface BookingConfirmation {
  bookingIds: string[];
  transactionId: string;
  reservationToken: string;
  ticketIds: string[];
  userId: string;
  email: string;
  status: "confirmed";
  confirmedAt: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const bookingsService = {
  createReservation: (body: CreateReservationRequest) =>
    apiFetch<Reservation>("/bookings/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  cancelReservation: (reservationToken: string, body: CancelReservationRequest) =>
    apiFetch<void>(`/bookings/reservations/${reservationToken}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  confirmBooking: (reservationToken: string, body: ConfirmBookingRequest) =>
    apiFetch<BookingConfirmation>(
      `/bookings/reservations/${reservationToken}/confirm`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    ),
};

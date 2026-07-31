import { useMutation } from "@tanstack/react-query";

import { bookingsService, ConfirmBookingRequest } from "@/services/bookings";

export function useConfirmBooking() {
  return useMutation({
    mutationFn: ({
      reservationToken,
      body,
    }: {
      reservationToken: string;
      body: ConfirmBookingRequest;
    }) => bookingsService.confirmBooking(reservationToken, body),
  });
}

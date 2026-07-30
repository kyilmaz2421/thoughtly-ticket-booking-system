import { useMutation } from "@tanstack/react-query";

import { bookingsService, CancelReservationRequest } from "@/services/bookings";

export function useCancelReservation() {
  return useMutation({
    mutationFn: ({
      reservationToken,
      body,
    }: {
      reservationToken: string;
      body: CancelReservationRequest;
    }) => bookingsService.cancelReservation(reservationToken, body),
  });
}

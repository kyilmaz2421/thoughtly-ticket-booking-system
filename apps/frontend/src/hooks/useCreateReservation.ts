import { useMutation } from "@tanstack/react-query";

import { bookingsService, CreateReservationRequest } from "@/services/bookings";

export function useCreateReservation() {
  return useMutation({
    mutationFn: (body: CreateReservationRequest) =>
      bookingsService.createReservation(body),
  });
}

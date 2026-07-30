import { useMutation, useQuery } from "@tanstack/react-query";

import { bookingsService, ConfirmBookingRequest } from "@/services/bookings";
import { usersService } from "@/services/users";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => usersService.getMe(),
    staleTime: Infinity, // treat as session-stable for the demo
  });
}

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

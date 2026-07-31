import { useMutation, useQuery } from "@tanstack/react-query";

import { bookingsService, ConfirmBookingRequest } from "@/services/bookings";
import { usersService } from "@/services/users";

const USER_STORAGE_KEY = "currentUser";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // mimick a user being "authenticaed" as close to possible
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      const user = await usersService.getMe();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    },
    staleTime: Infinity,
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

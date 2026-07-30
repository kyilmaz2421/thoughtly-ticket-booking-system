import { useMutation, useQuery } from '@tanstack/react-query';

import { bookingsService, ConfirmBookingRequest, CreateReservationRequest } from '@/services/bookings';
import { usersService } from '@/services/users';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => usersService.getMe(),
    staleTime: Infinity, // treat as session-stable for the demo
  });
}

export function useCreateReservation() {
  return useMutation({
    mutationFn: (body: CreateReservationRequest) => bookingsService.createReservation(body),
  });
}

export function useConfirmBooking() {
  return useMutation({
    mutationFn: ({ reservationToken, body }: { reservationToken: string; body: ConfirmBookingRequest }) =>
      bookingsService.confirmBooking(reservationToken, body),
  });
}

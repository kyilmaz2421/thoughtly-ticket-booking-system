import { useQuery, useQueryClient } from "@tanstack/react-query";

import { eventsService } from "@/services/events";

// Returns a callback that invalidates all ticket pages for an event.
export function useTicketsInvalidate(eventId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["tickets", eventId] });
}

export function useTickets(
  eventId: string,
  section?: string,
  cursor?: string,
  limit = 10,
  userId?: string,
  quantity?: number,
) {
  return useQuery({
    queryKey: ["tickets", eventId, section, cursor, limit, userId, quantity],
    queryFn: () => eventsService.getTickets(eventId, section, cursor, limit, userId, quantity),
    enabled: !!eventId && !!userId,
  });
}

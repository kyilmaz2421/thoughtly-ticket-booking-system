import { useQuery } from "@tanstack/react-query";

import { eventsService } from "@/services/events";

export function useTickets(
  eventId: string,
  section?: string,
  cursor?: string,
  limit = 10,
) {
  return useQuery({
    queryKey: ["tickets", eventId, section, cursor, limit],
    queryFn: () => eventsService.getTickets(eventId, section, cursor, limit),
    enabled: !!eventId,
  });
}

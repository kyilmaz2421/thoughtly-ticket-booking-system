import { useQuery } from "@tanstack/react-query";

import { eventsService } from "@/services/events";

export function useEvents(cursor?: string, limit = 10) {
  return useQuery({
    queryKey: ["events", cursor, limit],
    queryFn: () => eventsService.getAll(cursor, limit),
  });
}

import { useQuery } from '@tanstack/react-query';

import { eventsService } from '@/services/events';

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.getOne(id),
    enabled: !!id,
  });
}

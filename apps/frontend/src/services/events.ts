import { apiFetch } from './api-client';

export interface VenueSummary {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  createdAt: string;
}

export interface VenueDetail extends VenueSummary {
  addressLine1: string;
  addressLine2: string;
  stateProvince: string | null;
  postalOrZipCode: string;
  vipCapacity: number;
  frontRowCapacity: number;
  gaCapacity: number;
}

export interface EventHost {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface EventSummary {
  id: string;
  name: string;
  description: string;
  startDatetime: string;
  endDatetime: string;
  eventType: string;
  venue: VenueSummary;
  createdAt: string;
}

export interface EventDetail extends EventSummary {
  venue: VenueDetail;
  eventHost: EventHost;
}

export interface PaginatedEvents {
  data: EventSummary[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Ticket {
  id: string;
  eventId: string;
  section: string;
  seatNumber: number;
  priceCents: number;
  priceDisplay: string;
  createdAt: string;
}

export interface PaginatedTickets {
  data: Ticket[];
  nextCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

export const eventsService = {
  getAll: (cursor?: string, limit = DEFAULT_PAGE_SIZE) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return apiFetch<PaginatedEvents>(`/events?${params}`);
  },

  getOne: (id: string) => apiFetch<EventDetail>(`/events/${id}`),

  getTickets: (eventId: string, section?: string, cursor?: string, limit = DEFAULT_PAGE_SIZE) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (section) params.set('section', section);
    if (cursor) params.set('cursor', cursor);
    return apiFetch<PaginatedTickets>(`/events/${eventId}/tickets?${params}`);
  },
};

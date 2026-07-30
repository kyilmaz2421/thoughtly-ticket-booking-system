const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

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

export interface CreateBookingRequest {
  ticketId: string;
  name: string;
  email: string;
  payment: { cardNumber: string; expiry: string; cvv: string };
}

export interface BookingConfirmation {
  bookingId: string;
  ticketId: string;
  name: string;
  email: string;
  status: 'confirmed';
  confirmedAt: string;
}

export const api = {
  getEvents: (cursor?: string, limit = 10) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return apiFetch<PaginatedEvents>(`/events?${params}`);
  },
  getEvent: (id: string) => apiFetch<EventDetail>(`/events/${id}`),
  createBooking: (body: CreateBookingRequest) =>
    apiFetch<BookingConfirmation>('/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  getTickets: (eventId: string, section?: string, cursor?: string, limit = 10) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (section) params.set('section', section);
    if (cursor) params.set('cursor', cursor);
    return apiFetch<PaginatedTickets>(`/events/${eventId}/tickets?${params}`);
  },
};

/**
 * Events controller — reading & contract tests.
 *
 * What this suite proves:
 *   ✓ GET /events          — response has data array + hasMore flag
 *   ✓ GET /events/:id/tickets — returns available tickets for a seeded event
 *   ✓ GET /events/:id/tickets — returns empty data for an unknown event
 *   ✓ GET /events/:id/tickets — a held ticket is filtered from the list
 *   ✓ GET /events/:id/tickets — a booked (confirmed) ticket is filtered from the list
 *
 * Infrastructure: docker compose -f docker-compose.test.yml up -d
 *   Real Postgres on 5433, real Redis on 6380.
 */

import { createApp, flushTransientState, teardownApp, TestContext } from './helpers/create-app';

describe('Events (E2E)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createApp();
  }, 30_000);

  afterEach(async () => {
    await flushTransientState(ctx.db);
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await teardownApp(ctx.app, ctx.db);
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  async function reserve(userId: string, ticketIds: string[]) {
    const res = await ctx.api.post('/v1/bookings/reservations').send({ userId, ticketIds }).expect(201);
    return res.body as { reservationToken: string; userId: string; ticketIds: string[] };
  }

  // ─── Event listing ─────────────────────────────────────────────────────────

  describe('GET /v1/events', () => {
    it('returns seeded events with pagination shape', async () => {
      const res = await ctx.api.get('/v1/events').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(typeof res.body.hasMore).toBe('boolean');
    });

    it('each event has the expected shape', async () => {
      const res = await ctx.api.get('/v1/events').expect(200);
      const event = res.body.data[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('name');
    });
  });

  // ─── Ticket availability ───────────────────────────────────────────────────

  describe('GET /v1/events/:id/tickets', () => {
    it('returns available tickets for a seeded event', async () => {
      const res = await ctx.api.get(`/v1/events/${ctx.seedEventId}/tickets`).expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(typeof res.body.hasMore).toBe('boolean');
    });

    it('each ticket has the expected shape', async () => {
      const res = await ctx.api.get(`/v1/events/${ctx.seedEventId}/tickets`).expect(200);
      const ticket = res.body.data[0];
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('seatNumber');
      expect(ticket).toHaveProperty('priceCents');
    });

    it('returns empty data for a non-existent event', async () => {
      const res = await ctx.api.get('/v1/events/00000000-0000-0000-0000-000000000000/tickets').expect(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.hasMore).toBe(false);
    });

    it('a held ticket is absent from the available list', async () => {
      await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      const res = await ctx.api.get(`/v1/events/${ctx.seedEventId}/tickets`).expect(200);
      const ids: string[] = res.body.data.map((t: { id: string }) => t.id);
      expect(ids).not.toContain(ctx.seedTicketId);
    });

    it('a held ticket stays absent across repeated reads while the TTL is still live', async () => {
      await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      // Poll three times in quick succession — the Redis hold must persist across all reads
      for (let i = 0; i < 3; i++) {
        const res = await ctx.api.get(`/v1/events/${ctx.seedEventId}/tickets`).expect(200);
        const ids: string[] = res.body.data.map((t: { id: string }) => t.id);
        expect(ids).not.toContain(ctx.seedTicketId);
      }
    });

    it('a confirmed (booked) ticket is absent from the available list', async () => {
      jest.spyOn(ctx.paymentService, 'executePayment').mockResolvedValue({ transactionId: 'txn_ok' });

      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);
      await ctx.api
        .post(`/v1/bookings/reservations/${reservation.reservationToken}/confirm`)
        .send({
          userId: ctx.seedUserId,
          ticketIds: [ctx.seedTicketId],
          email: 'test@example.com',
          payment: { cardNumber: '4242424242424242', expiry: '12/30', cvv: '123', postalCode: '10001' },
        })
        .expect(201);

      const res = await ctx.api.get(`/v1/events/${ctx.seedEventId}/tickets`).expect(200);
      const ids: string[] = res.body.data.map((t: { id: string }) => t.id);
      expect(ids).not.toContain(ctx.seedTicketId);
    });
  });
});

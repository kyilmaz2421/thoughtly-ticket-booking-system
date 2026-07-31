/**
 * Bookings controller — concurrency & integrity tests.
 *
 * Four hard guarantees this suite proves:
 *
 *   1. READ CONSISTENCY
 *      While confirms fire concurrently, GET /tickets never returns a ticket
 *      that is simultaneously being confirmed (no dirty reads).
 *
 *   2. DOUBLE-BOOK PREVENTION (FOR UPDATE SKIP LOCKED + NOT EXISTS guard)
 *      N concurrent reserve attempts on the same ticket → exactly 1 wins (201),
 *      all others are rejected (409). A cancel re-opens the slot.
 *
 *   3. TTL SELF-EXPIRY
 *      When a Redis hold expires, confirm returns 410 and the ticket becomes
 *      immediately re-reservable by another user.
 *
 *   4. TRANSACTION INTEGRITY (@Transactional rollback)
 *      A payment failure leaves zero booking rows and zero payment_record rows.
 *      The hold is released so another user can reserve the ticket.
 *
 * Infrastructure: docker compose -f docker-compose.test.yml up -d
 *   Real Postgres on 5433, real Redis on 6380.
 */

import { Test } from '@nestjs/testing';
import supertest from 'supertest';

import { createApp, flushTransientState, teardownApp, TestContext } from './helpers/create-app';

// ─── Shared shapes ─────────────────────────────────────────────────────────────

interface Reservation {
  reservationToken: string;
  userId: string;
  ticketIds: string[];
  expiresAt: string;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Bookings (E2E) — concurrency & integrity', () => {
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

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function payment() {
    return { cardNumber: '4242424242424242', expiry: '12/30', cvv: '123', postalCode: '10001' };
  }

  async function reserve(userId: string, ticketIds: string[]): Promise<Reservation> {
    const res = await ctx.api.post('/v1/bookings/reservations').send({ userId, ticketIds }).expect(201);
    return res.body as Reservation;
  }

  async function confirm(reservation: Reservation) {
    return ctx.api.post(`/v1/bookings/reservations/${reservation.reservationToken}/confirm`).send({
      userId: reservation.userId,
      ticketIds: reservation.ticketIds,
      email: 'test@example.com',
      payment: payment(),
    });
  }

  // ─── Suite 1: Read consistency ────────────────────────────────────────────

  describe('Suite 1 — read consistency under concurrent activity', () => {
    it('GET /tickets never returns a ticket that is being confirmed concurrently', async () => {
      jest.spyOn(ctx.paymentService as any, 'stripePaymentRequest').mockResolvedValue({ transactionId: 'txn_ok' });

      // Reserve 5 distinct tickets, then fire all confirms + a polling read simultaneously
      const ticketsUnderTest = ctx.seedTicketPool.slice(0, 5);
      const reservations = await Promise.all(ticketsUnderTest.map((id) => reserve(ctx.seedUserId, [id])));

      // Kick off all confirms concurrently alongside a read
      const [ticketsRes, ...confirmResults] = await Promise.all([
        ctx.api.get(`/v1/events/${ctx.seedEventId}/tickets`),
        ...reservations.map((r) => confirm(r)),
      ]);

      // Every confirm must succeed
      for (const result of confirmResults) {
        expect(result.status).toBe(201);
      }

      // The concurrent read must not contain any of the tickets being confirmed
      const returnedIds: string[] = ticketsRes.body.data.map((t: { id: string }) => t.id);
      for (const id of ticketsUnderTest) {
        expect(returnedIds).not.toContain(id);
      }
    });
  });

  // ─── Suite 2: Double-book prevention ─────────────────────────────────────

  describe('Suite 2 — double-book prevention', () => {
    it('N concurrent reserve attempts on the same ticket → exactly 1 wins', async () => {
      const users = await ctx.db.query<{ id: string }[]>(`SELECT id FROM "user"`);

      const results = await Promise.all(
        users.map((u) =>
          ctx.api.post('/v1/bookings/reservations').send({ userId: u.id, ticketIds: [ctx.seedTicketId] }),
        ),
      );

      const winners = results.filter((r) => r.status === 201);
      const losers = results.filter((r) => r.status === 409);

      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(users.length - 1);
    });

    it('confirm without a prior reservation is rejected (no Redis key → 410)', async () => {
      const fakeToken = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      await ctx.api
        .post(`/v1/bookings/reservations/${fakeToken}/confirm`)
        .send({ userId: ctx.seedUserId, ticketIds: [ctx.seedTicketId], email: 'x@x.com', payment: payment() })
        .expect(410);
    });

    it('double-confirm same user on the same token: both fire concurrently, exactly 1 booking row written', async () => {
      jest.spyOn(ctx.paymentService as any, 'stripePaymentRequest').mockResolvedValue({ transactionId: 'txn_ok' });

      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      const [first, second] = await Promise.all([confirm(reservation), confirm(reservation)]);

      // One wins (201), the other hits the DB UNIQUE constraint which is caught and returned as 409
      const statuses = [first.status, second.status].sort();
      expect(statuses).toEqual([201, 409]);

      const [{ count }] = await ctx.db.query<{ count: string }[]>(`SELECT COUNT(*) FROM booking WHERE ticket_id = $1`, [
        ctx.seedTicketId,
      ]);
      expect(Number(count)).toBe(1);
    });

    it('double-confirm different users on the same token: wrong user is rejected by Redis, correct user wins', async () => {
      jest.spyOn(ctx.paymentService as any, 'stripePaymentRequest').mockResolvedValue({ transactionId: 'txn_ok' });

      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      // Craft a second confirm with a different userId — same token, wrong owner
      const impostor = ctx.api
        .post(`/v1/bookings/reservations/${reservation.reservationToken}/confirm`)
        .send({
          userId: ctx.seedUserId2,
          ticketIds: [ctx.seedTicketId],
          email: 'impostor@example.com',
          payment: payment(),
        });

      const [owner, intruder] = await Promise.all([confirm(reservation), impostor]);

      expect(owner.status).toBe(201);
      expect(intruder.status).toBe(403); // Redis userId check rejects the wrong user before touching the DB

      const [{ count, user_id }] = await ctx.db.query<{ count: string; user_id: string }[]>(
        `SELECT COUNT(*) as count, user_id FROM booking WHERE ticket_id = $1 GROUP BY user_id`,
        [ctx.seedTicketId],
      );
      expect(Number(count)).toBe(1);
      expect(user_id).toBe(ctx.seedUserId); // the correct user owns the booking
    });

    it('N concurrent reserves then N concurrent confirms — all succeed, N booking rows written', async () => {
      jest.spyOn(ctx.paymentService as any, 'stripePaymentRequest').mockResolvedValue({ transactionId: 'txn_ok' });

      const users = await ctx.db.query<{ id: string }[]>(`SELECT id FROM "user"`);
      const tickets = ctx.seedTicketPool.slice(0, users.length);

      // Phase 1: every user reserves their own distinct ticket simultaneously
      const reservations = await Promise.all(users.map((u, i) => reserve(u.id, [tickets[i]])));

      // Phase 2: all N confirms fire simultaneously
      const confirmResults = await Promise.all(reservations.map((r) => confirm(r)));

      for (const result of confirmResults) {
        expect(result.status).toBe(201);
      }

      const [{ count }] = await ctx.db.query<{ count: string }[]>(
        `SELECT COUNT(*) FROM booking WHERE ticket_id = ANY($1)`,
        [tickets],
      );
      expect(Number(count)).toBe(users.length);
    });

    it('multi-ticket reservation: overlapping ticket in a second reservation is rejected', async () => {
      // User 1 reserves tickets 0, 1, 2
      const ticketsA = ctx.seedTicketPool.slice(0, 3);
      await reserve(ctx.seedUserId, ticketsA);

      // User 2 tries to reserve tickets 2, 3 — ticket 2 is already held → 409
      const ticketsB = ctx.seedTicketPool.slice(2, 4);
      await ctx.api
        .post('/v1/bookings/reservations')
        .send({ userId: ctx.seedUserId2, ticketIds: ticketsB })
        .expect(409);
    });

    it('multi-ticket reservation happy path: two users reserve non-overlapping sets and both confirm', async () => {
      jest.spyOn(ctx.paymentService as any, 'stripePaymentRequest').mockResolvedValue({ transactionId: 'txn_ok' });

      // User 1 reserves tickets 0, 2 — User 2 reserves tickets 3, 5 (no overlap)
      const ticketsA = [ctx.seedTicketPool[0], ctx.seedTicketPool[2]];
      const ticketsB = [ctx.seedTicketPool[3], ctx.seedTicketPool[5]];

      const [reservationA, reservationB] = await Promise.all([
        reserve(ctx.seedUserId, ticketsA),
        reserve(ctx.seedUserId2, ticketsB),
      ]);

      const [confirmA, confirmB] = await Promise.all([confirm(reservationA), confirm(reservationB)]);

      expect(confirmA.status).toBe(201);
      expect(confirmB.status).toBe(201);

      const [{ count }] = await ctx.db.query<{ count: string }[]>(
        `SELECT COUNT(*) FROM booking WHERE ticket_id = ANY($1)`,
        [[...ticketsA, ...ticketsB]],
      );
      expect(Number(count)).toBe(4);
    });

    it('cancelling a held ticket makes it immediately re-reservable', async () => {
      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      await ctx.api
        .delete(`/v1/bookings/reservations/${reservation.reservationToken}`)
        .send({ userId: ctx.seedUserId, ticketIds: [ctx.seedTicketId] })
        .expect(204);

      // Slot is free — a different user can now win it
      await reserve(ctx.seedUserId2, [ctx.seedTicketId]);
    });

    it('a wrong-userId cancel is a no-op — the original owner can still confirm', async () => {
      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      await ctx.api
        .delete(`/v1/bookings/reservations/${reservation.reservationToken}`)
        .send({ userId: ctx.seedUserId2, ticketIds: [ctx.seedTicketId] })
        .expect(204);

      jest.spyOn(ctx.paymentService, 'executePayment').mockResolvedValue({ transactionId: 'txn_ok' });
      await confirm(reservation).then((r) => expect(r.status).toBe(201));
    });
  });

  // ─── Suite 3: TTL self-expiry ─────────────────────────────────────────────

  describe('Suite 3 — TTL self-expiry', () => {
    it('confirm returns 410 after the Redis hold has expired', async () => {
      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      const Redis = (await import('ioredis')).default;
      const client = new Redis(process.env.REDIS_URL!);
      await client.expire(`ticket:reserved:${ctx.seedTicketId}`, 1);
      await new Promise((r) => setTimeout(r, 1_500));
      await client.quit();

      await confirm(reservation).then((r) => expect(r.status).toBe(410));
    });

    it('an expired ticket is immediately re-reservable by another user', async () => {
      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);

      const Redis = (await import('ioredis')).default;
      const client = new Redis(process.env.REDIS_URL!);
      await client.expire(`ticket:reserved:${ctx.seedTicketId}`, 1);
      await new Promise((r) => setTimeout(r, 1_500));
      await client.quit();

      // 410 returned — slot is free
      await confirm(reservation).then((r) => expect(r.status).toBe(410));
      await reserve(ctx.seedUserId2, [ctx.seedTicketId]);
    });
  });

  // ─── Suite 4: Transaction integrity ──────────────────────────────────────

  describe('Suite 4 — @Transactional rollback on payment failure', () => {
    it('zero DB rows written when payment fails', async () => {
      jest.spyOn(ctx.paymentService, 'executePayment').mockRejectedValue(new Error('Card declined'));

      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);
      await confirm(reservation).then((r) => expect(r.status).toBe(500));

      const [{ count: bookingCount }] = await ctx.db.query<{ count: string }[]>(
        `SELECT COUNT(*) FROM booking WHERE ticket_id = $1`,
        [ctx.seedTicketId],
      );
      expect(Number(bookingCount)).toBe(0);

      const [{ count: prCount }] = await ctx.db.query<{ count: string }[]>(`SELECT COUNT(*) FROM payment_record`);
      expect(Number(prCount)).toBe(0);
    });

    it('hold is released after payment failure — another user can reserve immediately', async () => {
      jest.spyOn(ctx.paymentService, 'executePayment').mockRejectedValue(new Error('Card declined'));

      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);
      await confirm(reservation);

      await reserve(ctx.seedUserId2, [ctx.seedTicketId]);
    });

    it('writes booking + payment_record on success (baseline)', async () => {
      jest.spyOn(ctx.paymentService as any, 'stripePaymentRequest').mockResolvedValue({ transactionId: 'txn_ok' });

      const reservation = await reserve(ctx.seedUserId, [ctx.seedTicketId]);
      const res = await confirm(reservation);
      expect(res.status).toBe(201);
      expect(res.body.transactionId).toBe('txn_ok');

      const [{ count: bookingCount }] = await ctx.db.query<{ count: string }[]>(
        `SELECT COUNT(*) FROM booking WHERE ticket_id = $1`,
        [ctx.seedTicketId],
      );
      expect(Number(bookingCount)).toBe(1);

      const [{ count: prCount }] = await ctx.db.query<{ count: string }[]>(
        `SELECT COUNT(*) FROM payment_record WHERE user_id = $1`,
        [ctx.seedUserId],
      );
      expect(Number(prCount)).toBe(1);
    });
  });
});

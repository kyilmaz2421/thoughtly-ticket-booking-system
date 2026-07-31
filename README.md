# Thoughtly Ticket Booking System

An end-to-end concert ticket booking system built with Next.js (frontend), NestJS + TypeORM (backend), and PostgreSQL.

---

## Running with Docker (recommended — nothing else required)

The only requirement is [Docker Desktop](https://www.docker.com/products/docker-desktop/). No Node, no Postgres, no Redis needed on your machine.

NOTE: the docker compose runs all migrations and we have a SEED data migration that populates DB with relevant records to allow the app to be usable from the get go
-- In a real production environment we wouldn't seed the DB via a data migration like this

```bash
docker compose up
```

This will:

1. Start Postgres and Redis
2. Install all dependencies
3. Run all database migrations
4. Start the backend and frontend

| Service  | URL                      |
| -------- | ------------------------ |
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:4000/v1 |

To stop everything:

```bash
docker compose down
```

To stop and wipe the database (start fresh on next `up`):

```bash
docker compose down --volumes
```

---

## Running locally (manual setup)

### Prerequisites

- Node.js >= 22
- pnpm: `corepack enable && corepack prepare pnpm@latest --activate`
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`

### Install

```bash
pnpm install
```

### Run the backend

```bash
pnpm dev:backend
```

API runs at `http://localhost:4000`. DB connection defaults: host `localhost`, port `5432`, user `postgres`, password `postgres`, database `ticket_booking`.

### Run the frontend

```bash
pnpm dev:frontend
```

UI runs at `http://localhost:3000`.

## Migrations

Run from `apps/backend/` or prefix any command with `pnpm --filter backend`. Migration files live in `apps/backend/migrations/`.

```bash
# Apply all pending migrations (schema + data)
pnpm migration:run

# Roll back the last migration
pnpm migration:revert

# Show migration status
pnpm migration:show
```

---

## Testing

### What we test

Tests run against real Postgres and real Redis — no mocks for infrastructure. The only thing stubbed is the Stripe payment gateway so tests don't make live charges.

The seed data migration does a lot of heavy lifting here: it populates users, events, venues, and a full ticket inventory before any test runs. Tests resolve IDs from the live database rather than hardcoding them, so the suite works correctly regardless of which UUIDs Postgres assigns. Without seeding, there would be nothing to reserve or confirm against.
-- In a real production system we wouldn't have a data migration taht seeds the database for tests, there would be a seperate dtaabasse seeding process

Tests are split into two files by concern:

**`test/events.e2e-spec.ts`** — reading contracts for the events controller:

- `GET /events` returns a paginated list with the expected shape
- `GET /events/:id/tickets` returns available tickets with the correct fields
- Unknown event IDs return an empty result (not a 404)
- A held ticket is absent from the list immediately after the hold is placed
- A held ticket **stays absent across repeated reads** for the full TTL window — the Redis key is durable, not ephemeral
- A confirmed (booked) ticket is absent from the list permanently

**`test/bookings.e2e-spec.ts`** — the four hard concurrency and integrity guarantees:

| Suite                     | What it proves                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Read consistency          | Concurrent confirms + a simultaneous `GET /tickets` — the read never returns a ticket being confirmed at that moment                                               |
| Double-book prevention    | N users racing to reserve the same ticket → exactly 1 wins (201), all others get 409 — the `FOR UPDATE SKIP LOCKED` + Lua SETNX guard holds under real concurrency |
| TTL self-expiry           | After the Redis key expires, confirm returns 410 and the ticket is immediately re-reservable by another user                                                       |
| `@Transactional` rollback | Payment failure leaves zero `booking` rows and zero `payment_record` rows in the database; hold is released so the ticket can be re-reserved                       |

### How to run

The only prerequisite is [Docker Desktop](https://www.docker.com/products/docker-desktop/). The script starts isolated test containers (Postgres on 5433, Redis on 6380), runs the full suite, then tears down everything — including on failure.

```bash
pnpm test:e2e:docker
```

If you already have the test containers running from a previous session, you can skip the Docker management and run Jest directly:

```bash
docker compose -f docker-compose.test.yml up -d
pnpm test:e2e
```

---

## Data Model Design

### Upfront ticket generation

When an event is created, one row per physical ticket is generated from the venue's section capacities. At scale this means hundreds of millions of rows over time. We accepted this cost because tickets are written once and almost never updated — with proper indexing on `(event_id, section)` this does not hurt query performance. What we get in return: complete auditability, availability as a database fact rather than inferred state, and correctness that doesn't depend on application logic being right.

### Double booking prevention

Availability is inferred by whether a `bookings` row references a ticket — no status flag. The `UNIQUE` constraint on `bookings.ticket_id` is the hard database-level guarantee: two bookings for the same ticket are physically impossible. During the booking flow we use `SELECT ... FOR UPDATE SKIP LOCKED` to atomically claim a ticket — concurrent requests skip locked rows rather than queueing, which scales without contention.

### Payment records

`payment_record` rows are written only on payment success — one row per ticket in the booking. There is no FAILED status. If payment fails, the surrounding `@Transactional()` rolls back the entire operation: the booking rows never commit and no payment record is written. The database is left completely clean, as if the confirm attempt never happened. This means the presence of a `payment_record` is itself the signal that a booking completed — no status column needed.

Each record stores `user_id`, `booking_id`, `price_cents` (the total charge across all tickets in that batch), and the processor-returned `transaction_id`. Raw card details (number, CVV, expiry, postal code) are passed through to the payment processor but never persisted — PCI-DSS compliance.

### Indexes

Postgres UNIQUE constraints create implicit B-tree indexes, so `ticket(event_id, section, seat_number)` and `booking(ticket_id)` are already indexed. The explicit indexes added in `PerformanceIndexes1785391660069` cover the remaining hot paths:

| Index                           | Table                        | Reason                                                    |
| ------------------------------- | ---------------------------- | --------------------------------------------------------- |
| `ticket_event_id_idx`           | `ticket(event_id)`           | Full-event ticket scans when no section filter is applied |
| `booking_user_id_idx`           | `booking(user_id)`           | Booking history lookups by user                           |
| `payment_record_booking_id_idx` | `payment_record(booking_id)` | FK join — Postgres does not auto-index FK columns         |
| `payment_record_user_id_idx`    | `payment_record(user_id)`    | Payment history lookups by user                           |

### Other trade-offs

- **No `venue_id` on Ticket** — reachable via `ticket → event → venue` in one indexed hop. Denormalizing it would create an update anomaly with no benefit on the hot booking path.
- **Capacity enforcement is application-level** — the service that generates tickets reads venue capacities and creates exactly that many rows in one transaction. A DB trigger would be the production hardening step.

---

## Backend Service Structure

NestJS is an opinionated framework built around modules, and we chose to follow its conventions rather than fight them. Each feature is a self-contained module with its own controller, service, DTOs, and entities co-located together. This means the structure of the backend mirrors the data model directly — one module per domain concept.

```
src/
  events/          # Event, Ticket entities + GET /v1/events routes
    dto/           # API response shapes owned by this module
    entities/
  bookings/        # Booking entity + POST /v1/bookings routes + PaymentService
    dto/
    entities/
  venues/          # Venue entity + VenueDto (imported by events)
    dto/
    entities/
  users/           # User entity (imported by bookings)
    entities/
  hosts/           # EventHost entity + EventHostDto (imported by events)
    dto/
    entities/
  common/          # Config and DataSource — app-level infrastructure, not a feature
```

**Why this structure:**

- `Ticket` lives inside `events/` because tickets are created and owned by the event lifecycle. There is no tickets endpoint independent of an event.
- `Booking` has its own module because checkout is a distinct domain — it orchestrates across events, users, Redis holds, and payments.
- `Venue`, `User`, and `EventHost` have no controllers yet — they are supporting entities imported by other modules. Their modules exist so TypeORM repositories can be injected via `forFeature()`.
- Request DTOs (create/update input shapes) always live in the module that receives them. Response DTOs live in the module that owns the entity — `VenueDto` lives in `venues/dto/` and is imported by `events/` because the venue module is the authoritative source for how a venue is serialized.
- `PaymentService` lives inside `bookings/` since payment is a step in the booking flow, not a standalone feature.

### Event Reservation Holds Flow

The booking flow is split into three coordinated stages, all held together by a Redis TTL reservation system.

**1. Reading available tickets**

When a user opens an event page, `GET /v1/events/:id/tickets` returns only tickets that are neither booked nor currently held. The query excludes permanently booked tickets at the database level with a `NOT EXISTS (SELECT 1 FROM booking WHERE ticket_id = ticket.id)` subquery. Then, in a single Redis `MGET` call across all returned rows, any ticket whose key exists in Redis (i.e. is currently reserved by someone) is filtered out before the response is sent. The result is a list of tickets that are genuinely available right now.

**2. Reserving a ticket — the Redis hold**

When a user clicks Book, a `POST /v1/bookings/reservations` request runs an atomic Lua script against Redis that performs an all-or-nothing `SETNX` across all requested ticket keys. Each key is set with a TTL equal to the global hold window (e.g. 5 minutes). The stored value encodes `userId:reservationToken:expiresAt` in a single string — no secondary lookups needed.

**All tickets in a single reservation share the same `reservationToken`.** Each ticket gets its own Redis key (`ticket:reserved:{ticketId}`), but the value written under every key is identical. This means the token alone is sufficient to verify ownership across the entire group — cancel and confirm both use it as the single proof of ownership rather than checking each ticket independently. It also means a multi-ticket booking is cancelled atomically: one token covers all keys.

The hold is immutable once created. The `expiresAt` timestamp is embedded in the Redis value at write time and is never reset. If the same user retries the same reservation (e.g. due to a network error or React StrictMode double-fire), the Lua script detects the conflict and returns the existing value, including the original `expiresAt`. The caller receives the same token and expiry they would have gotten on first write. This means the hold cannot be extended by re-requesting it — the timer started when the key was first set and counts down regardless.

**3. Confirming the booking — closing the hold**

When the user submits payment, `POST /v1/bookings/reservations/:token/confirm` validates that every Redis key still exists and belongs to this user and token. If any key has expired or belongs to a different user, the request is rejected. Once ownership is confirmed, the backend runs `SELECT … FOR UPDATE SKIP LOCKED` on the tickets to guard against concurrent confirms.

The confirm handler is wrapped in `@Transactional()`. Inside that transaction:

1. **Booking rows are inserted first** — one row per ticket, before any payment attempt.
2. **Payment is charged** — the total price across all tickets is sent to the processor as a single charge. All payment fields (card number, expiry, CVV, postal code) are passed through to the processor end-to-end but never stored.
3. **On success** — one `payment_record` row is written per booking, referencing the processor's transaction ID. The transaction commits. The tickets are now permanently booked.
4. **On failure** — the processor throws, the transaction rolls back, and the booking rows inserted in step 1 are discarded. No `payment_record` is written. The database is left exactly as it was before the confirm attempt.

Whether the payment succeeds or fails, the Redis keys are deleted in a `finally` block — the hold is always released, so the user does not stay locked out of re-trying.

After a successful confirm, the ticket disappears from both systems: the `NOT EXISTS` subquery excludes it from future `GET /tickets` responses, and the Redis key is gone. The ticket is no longer visible to anyone.

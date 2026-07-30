# Thoughtly Ticket Booking System

An end-to-end concert ticket booking system built with Next.js (frontend), NestJS + TypeORM (backend), and PostgreSQL.

## Prerequisites

- Node.js >= 20
- pnpm: `corepack enable && corepack prepare pnpm@latest --activate`
- PostgreSQL running on `localhost:5432`

## Install

```bash
pnpm install
```

## Run the backend

```bash
pnpm dev:backend
```

API runs at `http://localhost:4000`. DB connection defaults: host `localhost`, port `5432`, user `postgres`, password `postgres`, database `ticket_booking`.

## Run the frontend

```bash
pnpm dev:frontend
```

UI runs at `http://localhost:3000`.

## Migrations

Run from `apps/backend/` or prefix any command with `pnpm --filter backend`. Migration files live in `apps/backend/migrations/`.

```bash
# Generate a schema migration (diffed from entities)
pnpm migration:generate:schema migrations/schema/TicketEntityMigration

# Generate a data migration (hand-written — file is created, you fill it in)
pnpm migration:generate:data migrations/data/SeedDefaultEvents

# Apply all pending migrations (schema + data)
pnpm migration:run

# Roll back the last migration
pnpm migration:revert

# Show migration status
pnpm migration:show
```

---

## Data Model Design

### Upfront ticket generation

When an event is created, one row per physical ticket is generated from the venue's section capacities. At scale this means hundreds of millions of rows over time. We accepted this cost because tickets are written once and almost never updated — with proper indexing on `(event_id, section)` this does not hurt query performance. What we get in return: complete auditability, availability as a database fact rather than inferred state, and correctness that doesn't depend on application logic being right.

### Double booking prevention

Availability is inferred by whether a `bookings` row references a ticket — no status flag. The `UNIQUE` constraint on `bookings.ticket_id` is the hard database-level guarantee: two bookings for the same ticket are physically impossible. During the booking flow we use `SELECT ... FOR UPDATE SKIP LOCKED` to atomically claim a ticket — concurrent requests skip locked rows rather than queueing, which scales without contention.

### Holds via Redis (planned)

A hold/reservation layer will be implemented in Redis: a TTL key reserves a ticket during checkout, the Postgres booking row is written on payment confirmation. Redis handles the UX hold; Postgres handles permanent correctness.

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

# Thoughtly Ticket Booking System

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

Run from `apps/backend/` or prefix any command with `pnpm --filter backend`.

Schema migrations are auto-generated from entity changes. Data migrations are hand-written for seeding or data transforms.

```bash
# Generate a schema migration (diffed from entities)
pnpm migration:generate:schema --name=TicketEntityMigration

# Generate a data migration (hand-written — file is created, you fill it in)
pnpm migration:generate:data --name=SeedDefaultEvents

# Apply all pending migrations (schema + data)
pnpm migration:run

# Roll back the last migration
pnpm migration:revert

# Show migration status
pnpm migration:show
```

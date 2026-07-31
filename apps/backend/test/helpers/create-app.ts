/**
 * Shared test app factory.
 * Each spec file calls this once in beforeAll — it boots NestJS, runs
 * migrations, and returns resolved seed IDs so tests don't query for them.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from '../../src/app.module';
import { PaymentService } from '../../src/bookings/payment.service';

export interface TestContext {
  app: INestApplication;
  api: ReturnType<typeof supertest>;
  db: DataSource;
  paymentService: PaymentService;
  seedUserId: string;
  seedUserId2: string;
  seedEventId: string;
  seedTicketId: string;
  seedTicketId2: string;
  /** A pool of ticket IDs for the same event — useful for concurrency tests */
  seedTicketPool: string[];
}

export async function createApp(): Promise<TestContext> {
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5433';
  process.env.DB_USER = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.DB_NAME = 'ticket_booking_test';
  process.env.REDIS_URL = 'redis://localhost:6380';

  initializeTransactionalContext();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const db = moduleRef.get<DataSource>(getDataSourceToken());
  addTransactionalDataSource(db);
  const paymentService = moduleRef.get(PaymentService);

  await app.init();
  await db.runMigrations();

  const [user] = await db.query<{ id: string }[]>(`SELECT id FROM "user" LIMIT 1`);
  const [user2] = await db.query<{ id: string }[]>(
    `SELECT id FROM "user" WHERE id != $1 LIMIT 1`,
    [user.id],
  );
  const [event] = await db.query<{ id: string }[]>(`SELECT id FROM "event" LIMIT 1`);
  const tickets = await db.query<{ id: string }[]>(
    `SELECT id FROM ticket WHERE event_id = $1 ORDER BY seat_number LIMIT 20`,
    [event.id],
  );

  return {
    app,
    api: supertest(app.getHttpServer() as Parameters<typeof supertest>[0]),
    db,
    paymentService,
    seedUserId: user.id,
    seedUserId2: user2.id,
    seedEventId: event.id,
    seedTicketId: tickets[0].id,
    seedTicketId2: tickets[1].id,
    seedTicketPool: tickets.map((t) => t.id),
  };
}

export async function flushTransientState(db: DataSource): Promise<void> {
  await db.query(`DELETE FROM payment_record`);
  await db.query(`DELETE FROM booking`);
  const Redis = (await import('ioredis')).default;
  const client = new Redis(process.env.REDIS_URL!);
  await client.flushall();
  await client.quit();
}

export async function teardownApp(app: INestApplication, db: DataSource): Promise<void> {
  await db.undoLastMigration(); // reverts data migration
  await db.undoLastMigration(); // reverts schema migration
  await app.close();
}

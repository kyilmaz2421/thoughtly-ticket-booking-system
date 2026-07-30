import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from './app.module';
import { Config } from './common/config';

async function bootstrap() {
  // Must be called before the app is created so AsyncLocalStorage is ready
  // before any @Transactional() decorator runs.
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);

  // Order matters: prefix, pipes, and cors configure the app before it opens for traffic.
  // addTransactionalDataSource comes last (but before listen) so the DataSource is fully
  // initialised by TypeORM before we hand it to the transactional context.
  // listen() is always the final call — nothing should be registered after it.

  // v1 prefix applied globally — bump to v2 here when breaking changes are needed
  app.setGlobalPrefix('v1');

  // Global pipe: runs on every incoming request before it reaches a controller.
  // transform: true  — instantiates DTO classes and applies class-transformer decorators (e.g. @Type(() => Number) coerces query strings to numbers).
  // whitelist: true  — strips any properties not declared on the DTO, so unknown query params never reach the handler.
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.enableCors({ origin: Config.CLIENT_URL });

  // Must be called after the app is fully configured and before listen() so that
  // @Transactional() decorators can propagate transaction context via AsyncLocalStorage.
  addTransactionalDataSource(app.get(DataSource));

  await app.listen(Config.PORT);
  console.log(`Backend listening on port ${Config.PORT}`);
}

void bootstrap();

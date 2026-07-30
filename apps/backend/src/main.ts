import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { Config } from './common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // v1 prefix applied globally — bump to v2 here when breaking changes are needed
  app.setGlobalPrefix('v1');
  // Global pipe: runs on every incoming request before it reaches a controller.
  // transform: true  — instantiates DTO classes and applies class-transformer decorators (e.g. @Type(() => Number) coerces query strings to numbers).
  // whitelist: true  — strips any properties not declared on the DTO, so unknown query params never reach the handler.
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: Config.CLIENT_URL });
  await app.listen(Config.PORT);
  console.log(`Backend listening on port ${Config.PORT}`);
}

void bootstrap();

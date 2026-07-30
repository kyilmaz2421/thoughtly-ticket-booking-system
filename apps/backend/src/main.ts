import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { Config } from './common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // v1 prefix applied globally — bump to v2 here when breaking changes are needed
  app.setGlobalPrefix('v1');
  await app.listen(Config.PORT);
  console.log(`Backend listening on http://localhost:${Config.PORT}`);
}

void bootstrap();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Config } from "./config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(Config.PORT);
  console.log(`Backend listening on http://localhost:${Config.PORT}`);
}

bootstrap();

import { Module } from '@nestjs/common';
import Redis from 'ioredis';

import { Config } from '../common/config';

import { RedisService } from './redis.service';

// Internal token — only RedisService injects this.
// Nothing outside this module can reach the raw client.
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis => new Redis(Config.REDIS_URL),
    },
    RedisService,
  ],
  exports: [RedisService], // export the abstraction, not the raw client
})
export class RedisModule {}

import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { DEFAULT_RESERVATION_TTL_SECONDS, TypedKey } from './redis.keys';
import { REDIS_CLIENT } from './redis.module';

// Atomically sets all keys to value with TTL only if NONE of them already exist.
// Returns 1 if all keys were set, 0 if any key already existed (no keys are written).
// Redis executes Lua scripts in a single atomic step — nothing can interleave.
const SET_NX_MANY_SCRIPT = `
  for i = 1, #KEYS do
    if redis.call('EXISTS', KEYS[i]) == 1 then
      return 0
    end
  end
  for i = 1, #KEYS do
    redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2])
  end
  return 1
`;

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  // Atomic all-or-nothing bulk SETNX via Lua.
  // Returns true if all keys were claimed, false if any was already taken (nothing written).
  async setNxMany<V extends string>(
    keyObjs: TypedKey<V>[],
    value: V,
    ttlSeconds = DEFAULT_RESERVATION_TTL_SECONDS,
  ): Promise<boolean> {
    const keys = keyObjs.map((k) => k.key);
    const result = await this.client.eval(SET_NX_MANY_SCRIPT, keys.length, ...keys, value, String(ttlSeconds));
    return result === 1;
  }

  // Returns null if the key does not exist or has expired.
  async get<V extends string>(keyObj: TypedKey<V>): Promise<V | null> {
    return this.client.get(keyObj.key) as Promise<V | null>;
  }

  // SET key value EX ttl NX — only sets if key does not already exist.
  // Returns true if the key was set, false if it already existed (another reservation holds it).
  async setNx<V extends string>(
    keyObj: TypedKey<V>,
    value: V,
    ttlSeconds = DEFAULT_RESERVATION_TTL_SECONDS,
  ): Promise<boolean> {
    const result = await this.client.set(keyObj.key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async del(...keyObjs: TypedKey<unknown>[]): Promise<void> {
    await this.client.del(...keyObjs.map((k) => k.key));
  }
}

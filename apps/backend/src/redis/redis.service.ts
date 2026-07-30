import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { Config } from '../common/config';

import { DEFAULT_RESERVATION_TTL_SECONDS, TypedKey } from './redis.keys';

// Nominal typing shim for TypeScript's structural type system.
const SET_NX_MANY_SCRIPT = `
  local conflicts = {}

  -- 1. Check all keys — GET returns nil if missing, so one call per key instead of EXISTS + GET
  for i = 1, #KEYS do
    local existing = redis.call('GET', KEYS[i])
    if existing then
      table.insert(conflicts, existing)
    end
  end

  -- 2. If any conflicts exist, return them immediately without setting anything
  if #conflicts > 0 then
    return conflicts
  end

  -- 3. If zero conflicts, safe to write all keys atomically
  for i = 1, #KEYS do
    redis.call('SET', KEYS[i], ARGV[1], 'EX', tonumber(ARGV[2]))
  end

  -- Return an empty array to signal total success
  return {}
`;

@Injectable()
export class RedisService {
  private readonly client = new Redis(Config.REDIS_URL);

  // Atomic all-or-nothing bulk SETNX via Lua.
  // Returns [] on success (all keys written).
  // Returns the conflicting stored values when any key already existed (nothing written).
  async setNxMany<V extends string>(
    keyObjs: TypedKey<V>[],
    value: V,
    ttlSeconds = DEFAULT_RESERVATION_TTL_SECONDS,
  ): Promise<V[]> {
    if (keyObjs.length === 0) return [];

    const keys = keyObjs.map((k) => k.key);
    const result = await this.client.eval(SET_NX_MANY_SCRIPT, keys.length, ...keys, value, String(ttlSeconds));
    return result as string[] as V[];
  }

  // Returns null if the key does not exist or has expired.
  async get<V extends string>(keyObj: TypedKey<V>): Promise<V | null> {
    return this.client.get(keyObj.key) as Promise<V | null>;
  }

  // Single round-trip bulk GET — returns values in the same order as the input keys.
  // Null means the key does not exist or has expired.
  async mget<V extends string>(keyObjs: TypedKey<V>[]): Promise<(V | null)[]> {
    if (keyObjs.length === 0) return [];
    return this.client.mget(...keyObjs.map((k) => k.key)) as Promise<(V | null)[]>;
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

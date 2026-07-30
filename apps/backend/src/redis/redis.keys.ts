// Nominal typing shim for TypeScript's structural type system.
// `unique symbol` is only equal to itself, so [__brand] is an unforgeable phantom property.
// The `declare const` means __brand never exists at runtime — zero cost, compile-time only.
// Tradeoff: the only way to produce a branded value is via an explicit `as Brand` cast,
// so each value type needs a controlled constructor (see RedisValue.*) that owns that cast.
declare const __brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [__brand]: B };

// Distinct value brand — prevents writing the wrong value to a ticket key at compile time
export type TicketReservedValue = Branded<string, 'TicketReservedValue'>;

// Carries the expected value type as a phantom — zero runtime cost
export type TypedKey<V> = { readonly key: string; readonly _type?: V };

export const DEFAULT_RESERVATION_TTL_SECONDS = 5 * 60; // 5 minutes

export const RedisKey = {
  // No reservation:{token} key — token lives only in ticket key values for ownership validation
  ticketReserved: (ticketId: string): TypedKey<TicketReservedValue> => ({ key: `ticket:reserved:${ticketId}` }),
} as const;

// Value format: "userId:reservationToken:expiresAt"
// Memory cost per key: ~36 (userId UUID) + 1 + ~36 (token UUID) + 1 + 24 (ISO date) ≈ 98 bytes of value.
// At 100k concurrent holds: ~10MB — negligible. Single GET reads all three fields in one round-trip,
// so the idempotency path costs zero extra Redis calls compared to storing userId+token alone.
export const RedisValue = {
  ticketReserved: (userId: string, reservationToken: string, expiresAt: string): TicketReservedValue =>
    `${userId}:${reservationToken}:${expiresAt}` as TicketReservedValue,
  parseTicketReserved: (value: TicketReservedValue): { userId: string; reservationToken: string; expiresAt: string } => {
    // Split on first two colons only — expiresAt is an ISO string which itself contains colons
    const firstColon = value.indexOf(':');
    const secondColon = value.indexOf(':', firstColon + 1);
    const userId = value.slice(0, firstColon);
    const reservationToken = value.slice(firstColon + 1, secondColon);
    const expiresAt = value.slice(secondColon + 1);
    return { userId, reservationToken, expiresAt };
  },
} as const;

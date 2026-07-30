export interface PaginatedResult<T> {
  page: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export function encodeCursor<T>(cursor: T): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor<T>(token: string): T {
  return JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as T;
}

export function paginate<T>(rows: T[], take: number, buildCursor: (last: T) => string): PaginatedResult<T> {
  const hasMore = rows.length === take;
  const page = hasMore ? rows.slice(0, -1) : rows;
  return { page, hasMore, nextCursor: hasMore ? buildCursor(page.at(-1)!) : null };
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.message === "string") message = body.message;
      else if (Array.isArray(body?.message)) message = body.message.join(", ");
    } catch {
      /* ignore parse failure */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

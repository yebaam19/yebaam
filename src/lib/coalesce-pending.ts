'use client';

const pending = new Map<string, Promise<unknown>>();

/** Share only concurrent browser reads; completed results remain subject to RLS and normal cache rules. */
export function coalescePending<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = pending.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const request = load();
  pending.set(key, request);
  const clear = () => {
    if (pending.get(key) === request) pending.delete(key);
  };
  request.then(clear, clear);
  return request;
}

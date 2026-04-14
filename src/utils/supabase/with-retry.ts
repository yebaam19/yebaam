// PostgREST returns transient errors during brief restarts. Retry a short
// window before bubbling the error to the caller. Safe to use on any
// thenable that resolves to `{ data, error }` — the common Supabase shape.
export async function withRetry<T>(run: () => PromiseLike<T>): Promise<T> {
  let result = await Promise.resolve(run());
  for (let attempt = 0; attempt < 4; attempt++) {
    const error = (result as { error?: { message?: string; status?: number } | null }).error;
    if (!error) return result;
    const msg = error.message ?? '';
    const status = error.status;
    const transient =
      status === 502 ||
      status === 503 ||
      status === 504 ||
      /schema cache|recovery mode|bad gateway|502|503|504/i.test(msg);
    if (!transient) return result;
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    result = await Promise.resolve(run());
  }
  return result;
}

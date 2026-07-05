/**
 * Map `items` through an async `fn`, running at most `limit` calls at a time.
 * Results keep the input order. Rejects on the first failure (like Promise.all)
 * and stops scheduling new calls once one has failed; calls already in flight
 * settle on their own.
 *
 * Used by the album upload forms: uploading 15 tracks with unbounded
 * Promise.all saturates a home uplink and makes every file crawl — capping
 * concurrency keeps per-file progress moving and failures isolated.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let failed = false;

  async function worker(): Promise<void> {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await fn(items[index]!, index);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

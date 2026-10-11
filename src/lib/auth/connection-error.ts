/** Only transient transport failures should trigger another session lookup. */
export function isAuthConnectionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ('name' in error && error.name === 'AuthRetryableFetchError') return true;
  if ('code' in error && error.code === 'ECONNREFUSED') return true;
  if (!('message' in error) || typeof error.message !== 'string') return false;

  return /fetch failed|failed to fetch|ECONNREFUSED|network|load failed/i.test(error.message);
}

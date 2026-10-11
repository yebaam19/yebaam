export async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';
  const maxAttempts = isIdempotent ? 4 : 2;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
    } catch (err) {
      const networkError =
        err instanceof Error ? err : new Error('Network error while contacting chat API');
      if (!isIdempotent || attempt === maxAttempts - 1) {
        throw new Error(networkError.message || 'Network error while contacting chat API');
      }
      lastError = networkError;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      continue;
    }

    if (response.ok) {
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return payload as T;
    }

    const rawText = await response.text().catch(() => '');
    let parsedError: string | null = null;
    try {
      const json = JSON.parse(rawText) as { error?: string };
      parsedError = json?.error ?? null;
    } catch {
      // not JSON
    }
    const message = parsedError || `Request failed (${response.status})`;
    const retriable =
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504 ||
      /schema cache|recovery mode|bad gateway/i.test(message) ||
      /schema cache|recovery mode|bad gateway/i.test(rawText);
    if (!retriable || attempt === maxAttempts - 1) {
      throw new Error(message);
    }
    lastError = new Error(message);
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw lastError ?? new Error('Network request failed');
}


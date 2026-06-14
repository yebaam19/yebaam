/**
 * Generate a unique id (UUID when the platform supports it, else a
 * timestamp+random fallback) for client/message identity inside an anonymous
 * chat channel.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

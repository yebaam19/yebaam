'use client';

/**
 * Tiny module-level pub/sub cache built on plain Maps and the React 18
 * `useSyncExternalStore` primitive. Replaces the parts of TanStack Query we
 * actually used (cache reads/writes, invalidate, optimistic updates) without
 * adding a third-party dependency.
 *
 * - `getCached(key)` / `setCached(key, value)` — direct read/write
 * - `invalidate(prefix)` — marks every entry under `prefix` stale and makes
 *   subscribed `useFetch` hooks refetch (see `getVersion`)
 * - `useCachedValue(key, fallback)` — subscribes a component to a key
 *
 * Cache keys are flat strings; for compound keys, JSON-stringify in the caller.
 */

type Listener = () => void;

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

/**
 * Contador por clave que `useFetch` incluye en las deps de su efecto.
 *
 * Sin esto, `invalidate()` sólo borraba la entrada y notificaba: el hook montado
 * se re-renderizaba con `data = null` — sin skeleton, porque `isLoading` ya era
 * false — y NUNCA volvía a pedir, porque sus deps `[flatKey, enabled]` no habían
 * cambiado. La lista se quedaba vacía hasta un remonte. Funcionaba "de milagro"
 * allí donde la mutación iba seguida de una navegación.
 */
const versions = new Map<string, number>();

function notify(key: string): void {
  const set = listeners.get(key);
  if (!set) return;
  for (const cb of set) cb();
}

function bumpVersion(key: string): void {
  versions.set(key, (versions.get(key) ?? 0) + 1);
}

/** Snapshot de la versión de una clave. Cambia en cada `invalidate`/`clearCached`. */
export function getVersion(key: string): number {
  return versions.get(key) ?? 0;
}

/** Registros escritos por `useFetch`: `{ data, fetchedAt }`. */
function isTimestampedRecord(value: unknown): value is { fetchedAt: number } {
  return typeof value === 'object' && value !== null && 'fetchedAt' in value;
}

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value);
  notify(key);
}

export function updateCached<T>(key: string, updater: (prev: T | undefined) => T): void {
  const next = updater(cache.get(key) as T | undefined);
  cache.set(key, next);
  notify(key);
}

/** Borra la entrada por completo. Un hook montado mostrará su skeleton y repedirá. */
export function clearCached(key: string): void {
  cache.delete(key);
  bumpVersion(key);
  notify(key);
}

/**
 * Marca stale toda entrada bajo `prefix` y despierta a sus suscriptores.
 *
 * NO borra los datos: stale-while-revalidate. El hook montado sigue pintando la
 * lista anterior mientras repide en segundo plano, en lugar de parpadear a vacío.
 * Se fuerza el refetch por dos vías, porque una sola no basta:
 *  - `fetchedAt = 0` vence el chequeo de `staleTime` (para montajes futuros),
 *  - el bump de versión cambia las deps del efecto de `useFetch` (para los ya montados).
 *
 * Recorre la UNIÓN de claves cacheadas y claves SUSCRITAS. Mirar sólo `cache`
 * dejaba fuera dos casos reales en los que sí hay un hook montado esperando:
 *  - su fetch inicial falló → `run()` nunca llamó a `setCached`, no hay entrada;
 *  - su fetch inicial sigue en vuelo → la entrada aún no existe.
 * En ambos, un invalidate silencioso dejaba la lista rota hasta el remonte. Al
 * despertar por suscriptor, el efecto se re-ejecuta: aborta el fetch en vuelo
 * (su respuesta obsoleta ya no escribe, `run()` corta en `signal.aborted`) y
 * repide después de la mutación.
 */
export function invalidate(prefix: string): void {
  const matches = (key: string) => key === prefix || key.startsWith(`${prefix}::`);
  const keys = new Set<string>();
  for (const key of cache.keys()) if (matches(key)) keys.add(key);
  for (const key of listeners.keys()) if (matches(key)) keys.add(key);

  for (const key of keys) {
    const record = cache.get(key);
    if (isTimestampedRecord(record)) {
      cache.set(key, { ...record, fetchedAt: 0 });
    }
    bumpVersion(key);
    notify(key);
  }
}

export function subscribe(key: string, listener: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(key);
  };
}

/** Build a stable cache key from any number of segments. */
export function cacheKey(...parts: ReadonlyArray<string | number | boolean | null | undefined>): string {
  return parts.filter((p) => p !== undefined && p !== null).join('::');
}

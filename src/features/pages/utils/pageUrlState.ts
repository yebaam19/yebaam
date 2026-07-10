/**
 * Sincroniza la sección abierta de la Página con la barra de direcciones para
 * que sea enlazable y sobreviva a una recarga.
 *
 * Se usa `history.replaceState` y no `router.replace()` a propósito: la sección
 * es estado de UI, no una navegación. Un `replace` de Next volvería a montar el
 * árbol y perdería el scroll; además el shell sólo se monta en cliente (mientras
 * `usePageBySlug` carga, la ruta pinta el spinner), así que leer
 * `window.location` en el inicializador de `useState` no puede desincronizar la
 * hidratación.
 */
export function replacePageQuery(updates: Record<string, string | null>): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState(null, '', url.toString());
}

/** Lee un parámetro de la URL actual. `null` en servidor. */
export function readPageQuery(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

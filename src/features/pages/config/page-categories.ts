/**
 * Fuente única de las categorías de una Página.
 *
 * La columna `pages.category` guarda DOS formatos históricos y ambos circulan:
 *  - la cadena legible que escribe el flujo de creación ('Artist, Band or Public Figure')
 *  - el código en mayúsculas de filas sembradas por SQL ('ENTERTAINMENT', 'ARTIST')
 * `getCategoryLabel` (utils/pageHelpers.ts) ya se ramifica sobre esa dualidad.
 *
 * Por eso NADIE debe comparar `page.category` directamente contra un código:
 * hay que pasarlo antes por `canonicalPageCategory()`.
 */

/** Opciones del selector de creación. El `value` es lo que se persiste. */
export const PAGE_CATEGORY_OPTIONS = [
  { value: 'Local Business', label: 'Negocio Local', code: 'LOCAL_BUSINESS' },
  { value: 'Company & Organization', label: 'Empresa y Organización', code: 'COMPANY' },
  { value: 'Brand or Product', label: 'Marca o Producto', code: 'BRAND' },
  {
    value: 'Artist, Band or Public Figure',
    label: 'Artista, Banda o Figura Pública',
    code: 'ARTIST',
  },
  { value: 'Entertainment', label: 'Entretenimiento', code: 'ENTERTAINMENT' },
  { value: 'Cause or Community', label: 'Causa o Comunidad', code: 'COMMUNITY' },
  { value: 'Sports & Recreation', label: 'Deportes y Recreación', code: 'SPORTS' },
  { value: 'Education', label: 'Educación', code: 'EDUCATION' },
  { value: 'Non-Profit Organization', label: 'Organización Sin Fines de Lucro', code: 'NON_PROFIT' },
  { value: 'Religious Organization', label: 'Organización Religiosa', code: 'RELIGIOUS' },
  { value: 'Health & Wellness', label: 'Salud y Bienestar', code: 'HEALTH' },
  { value: 'Personal Blog', label: 'Blog Personal', code: 'PERSONAL_BLOG' },
  { value: 'Shopping & Retail', label: 'Compras y Ventas', code: 'SHOPPING' },
  { value: 'Travel & Transportation', label: 'Viajes y Transporte', code: 'TRAVEL' },
  { value: 'Other', label: 'Otro', code: 'OTHER' },
] as const;

const DISPLAY_TO_CODE = new Map<string, string>(
  PAGE_CATEGORY_OPTIONS.map((o) => [o.value.toLowerCase(), o.code])
);

/**
 * Reduce cualquiera de los dos formatos a un código estable en mayúsculas.
 * Una cadena legible conocida se mapea a su código; un valor que ya parece un
 * código (o uno desconocido) se devuelve en mayúsculas, nunca se descarta.
 *
 * `'Artist, Band or Public Figure'` colapsa a `ARTIST`: en el vocabulario del
 * producto no existe un `PUBLIC_FIGURE` separado, aunque filas antiguas puedan
 * tenerlo, así que el llamador debe aceptar ambos.
 */
export function canonicalPageCategory(category: string | undefined | null): string {
  if (!category) return 'OTHER';
  const trimmed = category.trim();
  return DISPLAY_TO_CODE.get(trimmed.toLowerCase()) ?? trimmed.toUpperCase();
}

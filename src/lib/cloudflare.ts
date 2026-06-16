const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

/**
 * Build a Cloudflare Images delivery URL.
 * Always store only the `cf_image_id` in the DB — never the full URL.
 * The `variant` maps to a named variant configured in the Cloudflare dashboard.
 */
export function cfImageUrl(id: string | null | undefined, variant = 'public'): string | null {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/${variant}`
}

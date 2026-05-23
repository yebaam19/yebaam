import 'server-only'

/** Cloudflare delivery URL helper shared by badges server modules.
 *  Mirrors `src/features/cities/server/cf.ts`. */

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

export function cfImageUrl(id: string | null | undefined): string | null {
  if (!id) return null
  if (!CF_ACCOUNT_HASH) return null
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`
}

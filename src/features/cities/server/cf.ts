import 'server-only';

/**
 * Cloudflare delivery URL helper shared by every cities server module.
 *
 * The full URL is derived from the `id` (stored in the DB) plus the public
 * account hash (env). Never persist the full delivery URL — see AGENTS.md
 * "Media uploads — Cloudflare only".
 */

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

export function cfImageUrl(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  if (!CF_ACCOUNT_HASH) return undefined;
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`;
}

import type { PageSocialLinks } from '../../../types/page.types';

export type SocialKey = keyof PageSocialLinks;

export interface SocialNetworkDef {
  key: SocialKey;
  label: string;
  placeholder: string;
  /** Builds the outbound href from the stored value (handle or full URL). */
  href: (value: string) => string;
}

const asUrl = (value: string, base: string): string =>
  /^https?:\/\//i.test(value) ? value : `${base}${value.replace(/^@/, '')}`;

/**
 * Single source of truth for the Página's social networks — consumed by both the
 * settings editor (`SocialFields`) and the public display (`PageDetailAbout`), so
 * the two never drift. WhatsApp stores a phone number and resolves to a wa.me
 * deep-link; the rest accept either a handle or a full URL.
 */
export const SOCIAL_NETWORKS: readonly SocialNetworkDef[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'usuario o URL', href: (v) => asUrl(v, 'https://facebook.com/') },
  { key: 'instagram', label: 'Instagram', placeholder: '@usuario o URL', href: (v) => asUrl(v, 'https://instagram.com/') },
  { key: 'youtube', label: 'YouTube', placeholder: 'canal o URL', href: (v) => asUrl(v, 'https://youtube.com/@') },
  { key: 'tiktok', label: 'TikTok', placeholder: '@usuario o URL', href: (v) => asUrl(v, 'https://tiktok.com/@') },
  { key: 'x', label: 'X (Twitter)', placeholder: '@usuario o URL', href: (v) => asUrl(v, 'https://x.com/') },
  { key: 'spotify', label: 'Spotify', placeholder: 'artista o URL', href: (v) => asUrl(v, 'https://open.spotify.com/') },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+57 300 000 0000', href: (v) => `https://wa.me/${v.replace(/[^\d]/g, '')}` },
] as const;

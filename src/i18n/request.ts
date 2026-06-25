import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './locales';

const MESSAGE_NAMESPACES = [
  'avatar',
  'common',
  'header',
  'nav',
  'auth',
  'musica',
  'feed',
  'communities',
  'familias',
  'clubes',
  'profile',
  'profiles',
  'search',
  'verification',
  'landing',
  'foro',
  'chat',
  'grupos',
  'admin',
  'blogs',
  'article',
  'pages',
  'businesses',
  'cities',
  'portals',
  'professional',
  'liveStream',
  'watch',
  'askme',
  'notification',
  'friendships',
  'settings',
  'stories',
  'legal',
] as const;

async function loadMessages(locale: Locale) {
  const messages: Record<string, unknown> = {};
  await Promise.all(
    MESSAGE_NAMESPACES.map(async (ns) => {
      try {
        const mod = await import(`../../messages/${locale}/${ns}.json`);
        messages[ns] = mod.default;
      } catch {
        // Namespace not yet translated for this locale — skip silently.
      }
    }),
  );
  return messages;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const messages = await loadMessages(locale);
  return { locale, messages };
});

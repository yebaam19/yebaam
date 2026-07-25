import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './locales';
import { PATHNAME_HEADER, namespacesForPath, type Namespace } from './route-namespaces';

async function loadMessages(locale: Locale, namespaces: readonly Namespace[]) {
  const messages: Record<string, unknown> = {};
  await Promise.all(
    namespaces.map(async (ns) => {
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
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  // Only load the namespaces this route can actually reach. The full catalog is
  // ~290 KB and `app/layout.tsx` passes whatever lands here straight into
  // `NextIntlClientProvider`, so every unused namespace is dead weight
  // serialized into the page's HTML. Missing header (static generation, or a
  // path the proxy doesn't match) falls back to the full catalog.
  const namespaces = namespacesForPath(headerStore.get(PATHNAME_HEADER));

  return { locale, messages: await loadMessages(locale, namespaces) };
});

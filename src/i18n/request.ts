import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './locales';
import { ALL_NAMESPACES, type Namespace } from './route-namespaces';

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

// NOTE — do not re-introduce per-route namespace loading here without also
// moving the provider. `namespacesForPath()` (route-namespaces.ts) trims the
// ~290 KB catalog to just what a route needs, and measured -86% off the RSC
// payload. But `app/layout.tsx` mounts `NextIntlClientProvider`, and the App
// Router does NOT re-render a shared layout on client-side navigation — so
// after a soft nav from /feed into /[username], the page still held /feed's
// namespaces and `useTranslations('profile')` threw MISSING_MESSAGE. A hard
// reload of the same URL was fine, which is why it survived server-side checks.
//
// To land this properly the provider has to sit somewhere that re-renders per
// navigation (an `(app)/template.tsx` holding a nested provider, or per-page
// providers), with the root keeping only the always-constant shell namespaces.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();

  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return { locale, messages: await loadMessages(locale, ALL_NAMESPACES) };
});

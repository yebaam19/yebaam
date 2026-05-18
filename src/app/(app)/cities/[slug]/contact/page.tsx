import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ContactForm } from '@/features/cities/components/contact/ContactForm';
import { ContactHistory } from '@/features/cities/components/contact/ContactHistory';
import { fetchMyMessagesForCity } from '@/features/cities/server/contact.server';
import { getCityBySlug } from '@/features/cities/server/city.server';
import { getServerClient } from '@/utils/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  const t = await getTranslations('cities.contact.metadata');
  const cityName = city?.name ?? slug;
  return {
    title: t('title', { city: cityName }),
    description: t('description', { city: cityName }),
  };
}

/**
 * `/cities/[slug]/contact` — RSC.
 *
 * The form is rendered for everyone (so anonymous viewers see what the
 * destination looks like) but the submit button is replaced with a
 * sign-in CTA when there is no user. The "Mis mensajes anteriores"
 * history panel only renders when a user is signed in — RLS would
 * return `[]` anyway, but rendering an empty box for anon visitors
 * is noise.
 */
export default async function ContactPage({ params }: Props) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const currentUserId = auth.user?.id ?? null;

  const t = await getTranslations('cities.contact');

  // Pull history in parallel with auth check — if not signed in, this
  // returns `[]` from the server function shortcut, so the round-trip
  // is essentially free.
  const history = currentUserId
    ? await fetchMyMessagesForCity(client, city.id, currentUserId)
    : [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
          {t('header.title', { city: city.name })}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('header.subtitle')}
        </p>
      </header>

      <ContactForm
        cityId={city.id}
        citySlug={slug}
        currentUserId={currentUserId}
      />

      {currentUserId && <ContactHistory messages={history} />}
    </div>
  );
}

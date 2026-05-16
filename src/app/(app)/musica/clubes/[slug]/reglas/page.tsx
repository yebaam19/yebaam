import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/utils/supabase/server';
import { ClubRules } from '@/features/music-archive/components/club/ClubRules';

export default async function ClubRulesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await getServerClient();
  const { data } = await client
    .from('clubs')
    .select('rules')
    .eq('slug', slug)
    .eq('category', 'MUSICA')
    .maybeSingle();
  if (!data) notFound();
  const t = await getTranslations('musica');
  const rules = ((data as { rules: string[] | null }).rules ?? []) as string[];
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('clubs.rulesHeading')}</h2>
      <ClubRules rules={rules} />
    </section>
  );
}

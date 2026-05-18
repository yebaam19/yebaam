import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ClassifiedComposer } from '@/features/cities/components/classifieds/ClassifiedComposer';
import { getCityBySlug } from '@/features/cities/server/city.server';
import { getServerClient } from '@/utils/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('cities.classifieds.composer');
  return { title: `${t('title')} — ${slug}` };
}

export default async function NewClassifiedPage({ params }: Props) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const client = await getServerClient();
  const { data } = await client.auth.getUser();

  return (
    <div className="space-y-4">
      <ClassifiedComposer
        cityId={city.id}
        citySlug={slug}
        currentUserId={data.user?.id ?? null}
      />
    </div>
  );
}

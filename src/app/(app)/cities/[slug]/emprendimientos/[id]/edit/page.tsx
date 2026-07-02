import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EmprendimientoComposer } from '@/features/cities/components/emprendimientos/composer/EmprendimientoComposer';
import { getEmprendimientoById } from '@/features/cities/server/emprendimientos.server';
import { getCityBySlug } from '@/features/cities/server/city.server';
import { getServerClient } from '@/utils/supabase/server';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cities.emprendimientos.composer');
  return { title: t('editTitle') };
}

export default async function EditEmprendimientoPage({ params }: Props) {
  const { slug, id } = await params;
  const [city, item] = await Promise.all([getCityBySlug(slug), getEmprendimientoById(id)]);
  if (!city || !item || item.cityId !== city.id) notFound();

  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  const viewerId = data.user?.id ?? null;
  // Only the owner edits through this page (admins moderate from /admin).
  if (!viewerId || viewerId !== item.ownerId) notFound();

  return (
    <div className="space-y-4">
      <EmprendimientoComposer
        cityId={city.id}
        citySlug={slug}
        currentUserId={viewerId}
        initial={item}
      />
    </div>
  );
}

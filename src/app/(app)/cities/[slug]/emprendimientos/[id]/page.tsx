import Link from 'next/link';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ContactActions } from '@/features/cities/components/emprendimientos/detail/ContactActions';
import { DetailsPanel } from '@/features/cities/components/emprendimientos/detail/DetailsPanel';
import { EmprendimientoHero } from '@/features/cities/components/emprendimientos/detail/EmprendimientoHero';
import { EntrepreneurCard } from '@/features/cities/components/emprendimientos/detail/EntrepreneurCard';
import { MediaStrip } from '@/features/cities/components/emprendimientos/detail/MediaStrip';
import { OwnerControls } from '@/features/cities/components/emprendimientos/detail/OwnerControls';
import { PendingBanner } from '@/features/cities/components/emprendimientos/detail/PendingBanner';
import { RecommendButton } from '@/features/cities/components/emprendimientos/detail/RecommendButton';
import { StoryCard } from '@/features/cities/components/emprendimientos/detail/StoryCard';
import {
  getEmprendimientoById,
  getHasRecommended,
} from '@/features/cities/server/emprendimientos.server';
import { getCityBySlug } from '@/features/cities/server/city.server';
import { getServerClient } from '@/utils/supabase/server';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getEmprendimientoById(id);
  return { title: item ? item.name : 'Emprendimiento' };
}

/**
 * `/cities/[slug]/emprendimientos/[id]` — detail page mapping the client's
 * wireframe: hero + [Recomendar][Contacto], entrepreneur photo + details +
 * historia, and the 3-slot media strip. RLS hides non-APPROVED rows from the
 * public, so guests hitting a pending listing 404 naturally.
 */
export default async function EmprendimientoDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const [city, item] = await Promise.all([getCityBySlug(slug), getEmprendimientoById(id)]);
  if (!city || !item || item.cityId !== city.id) notFound();

  const t = await getTranslations('cities.emprendimientos');
  const client = await getServerClient();
  const { data: userData } = await client.auth.getUser();
  const viewerId = userData.user?.id ?? null;
  const viewerIsOwner = viewerId !== null && viewerId === item.ownerId;
  const approved = item.status === 'APPROVED';
  const hasRecommended =
    viewerId && !viewerIsOwner && approved ? await getHasRecommended(item.id, viewerId) : false;

  const listHref = `/cities/${slug}/emprendimientos`;
  const detailHref = `${listHref}/${item.id}`;
  const editHref = `${detailHref}/edit` as Route;

  const actions = (
    <>
      {approved && !viewerIsOwner && (
        <RecommendButton
          emprendimientoId={item.id}
          initialRecommended={hasRecommended}
          initialCount={item.recommendationsCount}
          viewerId={viewerId}
          loginRedirect={detailHref}
        />
      )}
      <ContactActions
        name={item.name}
        ownerId={item.ownerId}
        phone={item.phone}
        whatsapp={item.whatsapp}
        viewerId={viewerId}
        viewerIsOwner={viewerIsOwner}
        editHref={editHref}
        loginRedirect={detailHref}
      />
    </>
  );

  return (
    <div className="space-y-5">
      <Link
        href={listHref as Route}
        className="inline-flex text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        ← {t('detail.back')}
      </Link>

      <PendingBanner
        status={item.status}
        rejectionReason={item.rejectionReason}
        editHref={editHref}
        showEdit={viewerIsOwner}
      />

      <EmprendimientoHero
        name={item.name}
        heroImageUrl={item.heroImageUrl}
        zone={item.zone}
        verified={approved}
        actions={actions}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[280px_1fr]">
        <EntrepreneurCard
          ownerName={item.ownerName}
          ownerPhotoUrl={item.ownerPhotoUrl}
          cityName={city.name}
          verified={approved}
        />
        <div className="space-y-5">
          <DetailsPanel item={item} />
          <StoryCard story={item.story} />
        </div>
      </div>

      <MediaStrip items={item.media} />

      {viewerIsOwner && <OwnerControls emprendimientoId={item.id} listHref={listHref} />}
    </div>
  );
}

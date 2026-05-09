import Link from 'next/link';
import { UserGroupIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { FamilyWithViewer } from '../types/family.types';

export function FamilyCard({ family }: { family: FamilyWithViewer }) {
  const cover = family.cover_cf_image_id ? imageUrl(family.cover_cf_image_id, 'cover') : null;
  return (
    <Link
      href={`/feed/familias/${family.slug}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative h-32 w-full bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-emerald-900 dark:to-teal-800">
        {cover ? (
          <img
            src={cover}
            alt={family.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserGroupIcon className="h-12 w-12 text-white/80" />
          </div>
        )}
        {family.viewer_role === 'owner' && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-400/95 px-2 py-0.5 text-xs font-medium text-amber-950">
            Dueño
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {family.name}
        </h3>
        {family.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {family.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {family.member_count} {family.member_count === 1 ? 'miembro' : 'miembros'}
          </span>
          <span>·</span>
          <span>
            {family.person_count} {family.person_count === 1 ? 'persona' : 'personas'} en el árbol
          </span>
        </div>
      </div>
    </Link>
  );
}

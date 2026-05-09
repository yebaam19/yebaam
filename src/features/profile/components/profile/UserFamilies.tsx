'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowPathIcon, HomeIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { getFamiliesForProfileAction } from '@/features/families/actions/families.actions';
import type { FamilyWithViewer } from '@/features/families/types/family.types';

interface UserFamiliesProps {
  userId: string;
  isOwnProfile: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  member: 'Miembro',
};

export default function UserFamilies({ userId, isOwnProfile }: UserFamiliesProps) {
  const [families, setFamilies] = useState<FamilyWithViewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getFamiliesForProfileAction(userId);
        if (!cancelled && res.ok) setFamilies(res.data);
      } catch {
        if (!cancelled) setFamilies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-12 text-center shadow-sm dark:bg-zinc-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
          <HomeIcon className="h-8 w-8 text-zinc-400" />
        </div>
        {isOwnProfile ? (
          <>
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Aún no perteneces a ninguna familia
            </h3>
            <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
              Crea una familia o acepta una invitación para empezar.
            </p>
            <Link
              href="/feed/familias"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Ir a Familias
            </Link>
          </>
        ) : (
          <>
            <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No tienen familias en común
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Las familias son privadas; solo aparecen aquí las que ambos comparten.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {families.map((f) => (
        <FamilyMiniCard key={f.id} family={f} />
      ))}
    </div>
  );
}

function FamilyMiniCard({ family }: { family: FamilyWithViewer }) {
  const cover = family.cover_cf_image_id
    ? imageUrl(family.cover_cf_image_id, 'public')
    : null;
  const roleLabel = family.viewer_role ? ROLE_LABEL[family.viewer_role] : null;

  return (
    <Link
      href={`/feed/familias/${family.slug}`}
      className="group flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            aria-hidden
          />
        ) : (
          <HomeIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {family.name}
          </h3>
          {roleLabel && (
            <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {roleLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {family.member_count} {family.member_count === 1 ? 'miembro' : 'miembros'} ·{' '}
          {family.person_count} {family.person_count === 1 ? 'persona' : 'personas'}
        </p>
      </div>
    </Link>
  );
}

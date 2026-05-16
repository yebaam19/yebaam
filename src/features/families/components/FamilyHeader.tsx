import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { FamilyWithViewer } from '../types/family.types';

export async function FamilyHeader({ family }: { family: FamilyWithViewer }) {
  const t = await getTranslations('familias.detail');
  const cover = family.cover_cf_image_id ? imageUrl(family.cover_cf_image_id, 'cover') : null;
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-44 w-full bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-emerald-900 dark:to-teal-800">
        {cover && <img src={cover} alt={family.name} className="h-full w-full object-cover" />}
        <Link
          href="/feed/familias"
          className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur hover:bg-black/60"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {t('backToList')}
        </Link>
      </div>
      <div className="p-5">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{family.name}</h1>
        {family.description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{family.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>{t('memberCount', { count: family.member_count })}</span>
          <span>·</span>
          <span>{t('personCount', { count: family.person_count })}</span>
          {family.viewer_role && (
            <>
              <span>·</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 capitalize text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {family.viewer_role}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

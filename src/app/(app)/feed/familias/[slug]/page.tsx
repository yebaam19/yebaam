import { notFound } from 'next/navigation';
import Link from 'next/link';
import { UserGroupIcon } from '@/components/icons/heroicons-shim';
import {
  getFamilyBySlug,
  getFamilyPersons,
} from '@/features/families/server/families.server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  return { title: family?.name ?? 'Familia' };
}

export default async function FamilyHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  // The layout already gated. If we reach here without a role, render nothing —
  // the tree/timeline/etc. tabs aren't built yet, this is a placeholder home.
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const persons = await getFamilyPersons(family.id);

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <UserGroupIcon className="mx-auto h-10 w-10 text-zinc-400" />
      <h2 className="mt-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
        Tu familia está lista para crecer
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Por ahora hay {persons.length}{' '}
        {persons.length === 1 ? 'persona registrada' : 'personas registradas'} en este árbol.
        Empieza invitando a familiares y agregándolos al árbol.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href={`/feed/familias/${slug}/miembros`}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Ver miembros
        </Link>
      </div>
    </div>
  );
}

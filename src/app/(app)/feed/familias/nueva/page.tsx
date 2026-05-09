import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim';
import { getServerClient } from '@/utils/supabase/server';
import { CreateFamilyForm } from '@/features/families/components/CreateFamilyForm';

export const metadata = { title: 'Nueva familia' };

export default async function NewFamilyPage() {
  const client = await getServerClient();
  const { data: userRes } = await client.auth.getUser();
  if (!userRes.user) redirect('/login?redirect=/feed/familias/nueva');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/feed/familias"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a Familias
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Crear una nueva familia
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Una familia es un espacio privado por invitación. Después de crearla podrás agregar personas
        al árbol, eventos, fotos e invitar a otros familiares.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CreateFamilyForm />
      </div>
    </div>
  );
}

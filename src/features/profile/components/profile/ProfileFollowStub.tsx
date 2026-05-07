'use client';

import { UserPlusIcon } from '@/components/icons/heroicons-shim';
import { toast } from 'sonner';

/** Placeholder hasta exista API / RLS para seguir perfiles de usuario. */
export default function ProfileFollowStub() {
  return (
    <button
      type="button"
      onClick={() => toast.info('Pronto podrás seguir perfiles de usuario.')}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900"
      title="Seguir (próximamente)"
    >
      <UserPlusIcon className="h-4 w-4 shrink-0" aria-hidden />
      Seguir
    </button>
  );
}

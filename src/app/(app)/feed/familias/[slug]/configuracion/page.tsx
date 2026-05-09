import { notFound } from 'next/navigation';
import {
  getFamilyBySlug,
  getFamilyMembers,
} from '@/features/families/server/families.server';
import { EditFamilyForm } from '@/features/families/components/EditFamilyForm';
import { DeleteFamilyButton } from '@/features/families/components/DeleteFamilyButton';
import { TransferOwnershipDialog } from '@/features/families/components/TransferOwnershipDialog';

export const metadata = { title: 'Configuración' };

export default async function FamilyConfigurationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const isAdmin = family.viewer_role === 'owner' || family.viewer_role === 'admin';
  const isOwner = family.viewer_role === 'owner';

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        Solo los administradores pueden cambiar la configuración de la familia.
      </div>
    );
  }

  const members = isOwner ? await getFamilyMembers(family.id) : [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Información de la familia
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <EditFamilyForm family={family} />
        </div>
      </section>

      {isOwner && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Zona de peligro
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Transferir propiedad
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Cede el control de la familia a otro miembro. Tu rol pasa a admin.
              </p>
              <div className="mt-3">
                <TransferOwnershipDialog
                  familyId={family.id}
                  members={members}
                  currentOwnerId={family.owner_id}
                />
              </div>
            </div>
            <DeleteFamilyButton familyId={family.id} familyName={family.name} />
          </div>
        </section>
      )}
    </div>
  );
}

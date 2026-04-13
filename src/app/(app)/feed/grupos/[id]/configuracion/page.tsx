'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
} from '@/components/icons/heroicons-shim';
import { useGroup, useUpdateGroup } from '@/features/groups/hooks/useGroups';
import { toast } from 'sonner';

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const { data: group, isLoading } = useGroup(groupId);
  const updateGroupMutation = useUpdateGroup(groupId);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newPrivacy, setNewPrivacy] = useState<'public' | 'private'>('public');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    router.push('/feed/grupos');
    return null;
  }

  if (!group.isAdmin) {
    toast.error('No tienes permisos para acceder a esta página');
    router.push(`/feed/grupos/${groupId}`);
    return null;
  }

  const handlePrivacyToggle = (privacy: 'public' | 'private') => {
    setNewPrivacy(privacy);
    setShowConfirmModal(true);
  };

  const confirmPrivacyChange = async () => {
    try {
      await updateGroupMutation.mutateAsync({ privacy: newPrivacy });
      setShowConfirmModal(false);
    } catch (error) {
      console.error('[GroupSettings] Error updating privacy:', error);
    }
  };

  return (
    <div className="min-h-dvh min-w-0 bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto max-w-3xl min-w-0 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/feed/grupos/${groupId}`}
            className="mb-4 inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Volver al grupo
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">
            Configuración del grupo
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            {group.name}
          </p>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
              Privacidad
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Controla quién puede ver y unirse a tu grupo
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Public Option */}
            <button
              onClick={() => handlePrivacyToggle('public')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                group.privacy === 'public'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${
                  group.privacy === 'public'
                    ? 'bg-primary-600'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`}>
                  <GlobeAltIcon className={`h-6 w-6 ${
                    group.privacy === 'public'
                      ? 'text-white'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      Público
                    </h3>
                    {group.privacy === 'public' && (
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Cualquiera puede ver las publicaciones del grupo. Cualquiera puede unirse sin aprobación.
                  </p>
                </div>
              </div>
            </button>

            {/* Private Option */}
            <button
              onClick={() => handlePrivacyToggle('private')}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                group.privacy === 'private'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${
                  group.privacy === 'private'
                    ? 'bg-primary-600'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`}>
                  <LockClosedIcon className={`h-6 w-6 ${
                    group.privacy === 'private'
                      ? 'text-white'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      Privado
                    </h3>
                    {group.privacy === 'private' && (
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Solo los miembros pueden ver las publicaciones. Los administradores deben aprobar las solicitudes de membresía.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Cambiar privacidad del grupo
                </h3>
              </div>
              
              <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                ¿Estás seguro de que quieres cambiar la privacidad del grupo a{' '}
                <span className="font-semibold">
                  {newPrivacy === 'public' ? 'público' : 'privado'}
                </span>?
              </p>

              {newPrivacy === 'public' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-6">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                     Al hacer el grupo público, cualquier persona podrá ver todo el contenido y unirse sin aprobación.
                  </p>
                </div>
              )}

              {newPrivacy === 'private' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                     Al hacer el grupo privado, solo los miembros actuales podrán ver el contenido. Los nuevos miembros necesitarán aprobación.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={updateGroupMutation.isPending}
                  className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPrivacyChange}
                  disabled={updateGroupMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {updateGroupMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    'Confirmar cambio'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

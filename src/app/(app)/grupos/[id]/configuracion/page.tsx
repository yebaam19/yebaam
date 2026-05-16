'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim';
import { useGroup, useUpdateGroup, useDeleteGroup } from '@/features/groups/hooks/useGroups';
import { toast } from 'sonner';
import {
  PrivacySettings,
  EditInfoSection,
  DangerZoneSection,
  PrivacyConfirmModal,
  EditGroupModal,
  DeleteConfirmModal,
} from '@/features/groups/components/settings';

type ModalType = 'privacy' | 'edit' | 'delete' | null;

const CATEGORIES = [
  'Tecnología',
  'Arte y Fotografía',
  'Viajes',
  'Comida',
  'Negocios',
  'Salud',
  'Deportes',
  'Música',
  'Cine',
  'Libros',
  'Gaming',
  'Educación',
  'Otro',
];

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('grupos');
  const groupId = params.id as string;
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPrivacy, setNewPrivacy] = useState<'public' | 'private'>('public');
  
  const { data: group, isLoading } = useGroup(groupId);
  const updateGroupMutation = useUpdateGroup(groupId);
  const deleteGroupMutation = useDeleteGroup();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    router.push('/grupos');
    return null;
  }

  if (!group.isAdmin) {
    toast.error(t('settings.noPermission'));
    router.push(`/grupos/${groupId}`);
    return null;
  }

  const handlePrivacyToggle = (privacy: 'public' | 'private') => {
    setNewPrivacy(privacy);
    setActiveModal('privacy');
  };

  const confirmPrivacyChange = async () => {
    try {
      await updateGroupMutation.mutateAsync({ privacy: newPrivacy });
      setActiveModal(null);
    } catch (error) {
      console.error('[GroupSettings] Error updating privacy:', error);
    }
  };

  const handleEditSubmit = async (data: { name: string; description: string; category: string }) => {
    try {
      await updateGroupMutation.mutateAsync(data);
      setActiveModal(null);
      toast.success(t('settings.updateSuccess'));
    } catch (error) {
      console.error('[GroupSettings] Error updating group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      await deleteGroupMutation.mutateAsync(groupId);
      setActiveModal(null);
      // Navegar inmediatamente después de eliminar
      router.push('/grupos');
    } catch (error) {
      console.error('[GroupSettings] Error deleting group:', error);
      setIsDeleting(false);
    }
  };

  // Si estamos eliminando, mostrar loading
  if (isDeleting) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">{t('settings.loadingDelete')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh min-w-0 bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-10 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl min-w-0 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link 
              href={`/grupos/${groupId}`}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {t('settings.title')}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {group.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl min-w-0 space-y-6 px-3 py-5 sm:px-4 sm:py-6">
        {/* Privacy Settings */}
        <PrivacySettings 
          group={group}
          onPrivacyChange={handlePrivacyToggle}
        />

        {/* Edit Information */}
        <EditInfoSection onEdit={() => setActiveModal('edit')} />

        {/* Danger Zone */}
        <DangerZoneSection onDelete={() => setActiveModal('delete')} />
      </div>

      {/* Modals */}
      <PrivacyConfirmModal
        isOpen={activeModal === 'privacy'}
        newPrivacy={newPrivacy}
        isLoading={updateGroupMutation.isPending}
        onConfirm={confirmPrivacyChange}
        onCancel={() => setActiveModal(null)}
      />

      <EditGroupModal
        isOpen={activeModal === 'edit'}
        initialName={group.name}
        initialDescription={group.description}
        initialCategory={group.category}
        categories={CATEGORIES}
        isLoading={updateGroupMutation.isPending}
        onSave={handleEditSubmit}
        onCancel={() => setActiveModal(null)}
      />

      <DeleteConfirmModal
        isOpen={activeModal === 'delete'}
        groupName={group.name}
        onConfirm={handleDeleteGroup}
        onCancel={() => setActiveModal(null)}
      />
    </div>
  );
}

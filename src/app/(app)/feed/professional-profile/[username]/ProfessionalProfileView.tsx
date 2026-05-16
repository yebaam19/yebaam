'use client';

import { ArrowLeftIcon } from '@/components/icons/heroicons-shim';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { EditProfileDialog } from '@/features/professional-profile/components/dialogs';
import type { EditProfileFormData } from '@/features/professional-profile/components/dialogs/EditProfileDialog';
import { ContentTabs } from '@/features/professional-profile/components/profile/ContentTabs';
import { ProfileHeader } from '@/features/professional-profile/components/profile/ProfileHeader';
import type { ProfessionalProfile } from '@/features/professional-profile/interfaces/professional-profile.interfaces';

import { updateProfileAction } from '../server/profile.actions';

interface ProfessionalProfileViewProps {
  profile: ProfessionalProfile;
  isOwner: boolean;
  initialIsFollowing: boolean;
}

export function ProfessionalProfileView({ profile, isOwner, initialIsFollowing }: ProfessionalProfileViewProps) {
  const router = useRouter();
  const t = useTranslations('professional');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const userData = useMemo(() => {
    if (profile.user) return profile.user;
    return {
      id: profile.userId,
      firstName: 'Usuario',
      lastName: 'Profesional',
      username: profile.userId,
      avatar: null,
    };
  }, [profile]);

  const handleUpdateProfile = async (data: EditProfileFormData) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await updateProfileAction(profile.id, data);
        if (!result.ok) {
          toast.error(result.error);
          resolve();
          return;
        }
        toast.success('Perfil actualizado correctamente');
        setIsEditDialogOpen(false);
        router.refresh();
        resolve();
      });
    });
  };

  return (
    <div className="min-h-screen min-w-0 bg-neutral-50 dark:bg-neutral-900">
      <div className="mx-auto max-w-5xl min-w-0 px-4 py-5 sm:px-5">
        <div className="mb-5">
          <button
            onClick={() => router.push('/feed')}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('profile.back')}
          </button>
        </div>

        <div className="mb-5">
          <ProfileHeader
            profile={profile}
            user={userData}
            isOwner={isOwner}
            initialIsFollowing={initialIsFollowing}
            onEditProfile={() => setIsEditDialogOpen(true)}
          />
        </div>

        <ContentTabs profile={profile} isOwner={isOwner} isRefetching={isPending} />
      </div>

      {isOwner && (
        <EditProfileDialog
          isOpen={isEditDialogOpen}
          profile={profile}
          onClose={() => setIsEditDialogOpen(false)}
          onSubmit={handleUpdateProfile}
        />
      )}
    </div>
  );
}

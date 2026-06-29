'use client';

import { PhotoIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfileMediaStore } from '../../store/profile-media.store';
import { useUserPhotos } from '../../hooks/useProfile';

interface ProfilePhotosPreviewProps {
  userId: string;
  username: string;
}

type PhotoLike = { id: string; url: string; caption?: string };

export default function ProfilePhotosPreview({ userId, username }: ProfilePhotosPreviewProps) {
  const t = useTranslations('profile.sidebar');
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const { photos: profilePhotos, fetchUserPhotos } = useUserPhotos();
  const { photos: myPhotos, fetchMyPhotos } = useProfileMediaStore();

  useEffect(() => {
    if (isOwnProfile) {
      fetchMyPhotos();
    } else {
      fetchUserPhotos(userId);
    }
  }, [userId, isOwnProfile, fetchMyPhotos, fetchUserPhotos]);

  const photos = useMemo<PhotoLike[]>(() => {
    const source = (isOwnProfile ? myPhotos : profilePhotos) as Array<{
      id: string;
      url: string;
      caption?: string;
    }>;
    return (source ?? []).slice(0, 6).map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
    }));
  }, [isOwnProfile, myPhotos, profilePhotos]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('photos')}</h2>
        <Link
          href={`/${username}?tab=fotos`}
          className="text-primary text-sm font-medium hover:underline"
        >
          {t('viewAllPhotos')}
        </Link>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 py-6 text-center dark:border-gray-700">
          <PhotoIcon className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('noPhotos')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              href={`/${username}?tab=fotos`}
              className="group relative aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700"
            >
              <Image
                src={photo.url}
                alt={photo.caption || 'Foto'}
                fill
                className="object-cover object-center transition-opacity group-hover:opacity-95"
                sizes="(max-width: 1024px) 33vw, 120px"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

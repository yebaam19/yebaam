'use client';

import {
  DocumentTextIcon,
  VideoCameraIcon,
} from '@/components/icons/heroicons-shim';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '../../interfaces/profile.interfaces';

interface ProfileMoreLinksCardProps {
  user: UserProfile;
}

const items = [
  { tab: 'videos', labelKey: 'videos', icon: VideoCameraIcon },
  { tab: 'publicaciones', labelKey: 'publicaciones', icon: DocumentTextIcon },
] as const;

export default function ProfileMoreLinksCard({ user }: ProfileMoreLinksCardProps) {
  const t = useTranslations('profile');
  const firstName = user.firstName || user.username;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h2 className="mb-3 text-lg font-bold">{t('sidebar.moreOf', { name: firstName })}</h2>
      <nav className="flex flex-col">
        {items.map(({ tab, labelKey, icon: Icon }) => (
          <Link
            key={tab}
            href={`/${user.username}?tab=${tab}`}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span>{t(`tabs.${labelKey}`)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

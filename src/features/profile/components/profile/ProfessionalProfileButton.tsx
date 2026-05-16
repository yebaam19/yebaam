'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { BriefcaseIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';

interface ProfessionalProfileButtonProps {
  username: string;
  isOwnProfile: boolean;
  hasProfessionalProfile: boolean;
}

export default function ProfessionalProfileButton({
  username,
  isOwnProfile,
  hasProfessionalProfile,
}: ProfessionalProfileButtonProps) {
  const t = useTranslations('profile.actions');
  // Non-owner viewing a user without a professional profile (or without
  // visibility for it): button is absent.
  if (!isOwnProfile && !hasProfessionalProfile) return null;

  const href = (
    hasProfessionalProfile
      ? `/feed/professional-profile/${username}`
      : '/feed/professional-profile'
  ) as Route;

  const label = hasProfessionalProfile
    ? t('professionalProfile')
    : t('createProfessionalProfile');

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <BriefcaseIcon className="h-4 w-4" />
      {label}
    </Link>
  );
}

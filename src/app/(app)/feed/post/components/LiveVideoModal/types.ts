import type { useTranslations } from 'next-intl';
import {
  GlobeAltIcon,
  UserGroupIcon,
  LockClosedIcon,
} from '@/components/icons/heroicons-shim';

export type LiveStatus = 'preparing' | 'countdown' | 'live' | 'ending';
export type Privacy = 'public' | 'friends' | 'private';

export type FeedTranslator = ReturnType<typeof useTranslations<'feed'>>;

export const VISIBILITY_OPTIONS: Array<{
  value: Privacy;
  labelKey: 'public' | 'friends' | 'private';
  icon: typeof GlobeAltIcon;
  descriptionKey: 'publicDescription' | 'friendsDescription' | 'privateDescription';
}> = [
  { value: 'public', labelKey: 'public', icon: GlobeAltIcon, descriptionKey: 'publicDescription' },
  { value: 'friends', labelKey: 'friends', icon: UserGroupIcon, descriptionKey: 'friendsDescription' },
  { value: 'private', labelKey: 'private', icon: LockClosedIcon, descriptionKey: 'privateDescription' },
];

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

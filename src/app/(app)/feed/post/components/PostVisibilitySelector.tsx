'use client';

import { GlobeAltIcon, UserGroupIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Público', icon: GlobeAltIcon, description: 'Cualquiera puede ver' },
  { value: 'friends', label: 'Amigos', icon: UserGroupIcon, description: 'Solo tus amigos' },
  { value: 'private', label: 'Solo yo', icon: LockClosedIcon, description: 'Solo tú' },
] as const;

type VisibilityValue = 'public' | 'friends' | 'private';

interface PostVisibilitySelectorProps {
  value: VisibilityValue;
  onChange: (value: VisibilityValue) => void;
  disabled?: boolean;
}

export default function PostVisibilitySelector({
  value,
  onChange,
  disabled = false,
}: PostVisibilitySelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as VisibilityValue)}
      disabled={disabled}
      className="mt-1 rounded-md border-0 bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {VISIBILITY_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PhotoIcon, XMarkIcon, UserGroupIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { displayNameFor, type SearchResult } from './UserRow';

interface GroupComposerProps {
  selected: SearchResult[];
  name: string;
  onNameChange: (value: string) => void;
  photoPreview: string | null;
  isUploading: boolean;
  /** Need ≥2 members before a group can be created. */
  canCreate: boolean;
  onPickPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  isSubmitting: boolean;
  onCreate: () => void;
  onRemoveMember: (id: string) => void;
}

export default function GroupComposer({
  selected,
  name,
  onNameChange,
  photoPreview,
  isUploading,
  canCreate,
  onPickPhoto,
  onRemovePhoto,
  isSubmitting,
  onCreate,
  onRemoveMember,
}: GroupComposerProps) {
  const t = useTranslations('chat.newMessage');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
      {/* Group photo + name */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading || isSubmitting}
          aria-label={t('groupPhoto')}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        >
          {photoPreview ? (
            <Avatar src={photoPreview} alt={t('groupPhoto')} className="h-12 w-12" />
          ) : isUploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
          ) : (
            <PhotoIcon className="h-5 w-5" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickPhoto(file);
            e.target.value = '';
          }}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('groupNamePlaceholder')}
          maxLength={80}
          className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-neutral-800"
        />
        {photoPreview && (
          <button
            type="button"
            onClick={onRemovePhoto}
            aria-label={t('removePhoto')}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Selected members */}
      <div className="flex flex-wrap gap-2">
        {selected.map((u) => {
          const label = displayNameFor(u, t('userFallback'));
          return (
            <span
              key={u.id}
              className="flex items-center gap-1 rounded-full bg-neutral-100 py-1 pl-1 pr-2 text-xs dark:bg-neutral-800"
            >
              <Avatar src={u.avatar ?? null} alt={label} className="h-5 w-5" />
              <span className="max-w-[8rem] truncate text-neutral-800 dark:text-neutral-200">{label}</span>
              <button
                type="button"
                onClick={() => onRemoveMember(u.id)}
                aria-label={t('removePhoto')}
                className="rounded-full p-0.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>

      {!canCreate && (
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">{t('needMoreMembers')}</p>
      )}

      <button
        type="button"
        onClick={onCreate}
        disabled={isSubmitting || isUploading || !canCreate}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        <UserGroupIcon className="h-5 w-5" />
        {isSubmitting ? t('creatingGroup') : t('createGroup')}
      </button>
    </div>
  );
}

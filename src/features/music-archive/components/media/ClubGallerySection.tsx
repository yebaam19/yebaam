'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  QueueListIcon,
  Squares2X2Icon,
} from '@/components/icons/heroicons-shim';
import type { MusicMediaItem } from '../../types/music-media.types';
import { ClubMediaFeed } from './ClubMediaFeed';
import { MusicMediaGrid } from './MusicMediaGrid';
import { MusicMediaUploader } from './MusicMediaUploader';

type ViewMode = 'feed' | 'grid';
const STORAGE_KEY = 'yebaam:gallery-view';

// useSyncExternalStore subscribers — read once on mount, react to other tabs.
function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

function getSnapshot(): ViewMode {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'grid' ? 'grid' : 'feed';
  } catch {
    return 'feed';
  }
}

// Server snapshot must be stable across renders — always 'feed' (the default).
function getServerSnapshot(): ViewMode {
  return 'feed';
}

interface Props {
  clubId: string;
  clubName: string;
  canUpload: boolean;
  items: MusicMediaItem[];
}

export function ClubGallerySection({ clubId, clubName, canUpload, items }: Props) {
  const router = useRouter();
  const t = useTranslations('musica.media');
  const [showUploader, setShowUploader] = useState(false);
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [override, setOverride] = useState<ViewMode | null>(null);
  const view: ViewMode = override ?? stored;

  function changeView(next: ViewMode) {
    setOverride(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — private mode / disabled storage
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t('clubGalleryHeading')}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('clubGallerySubtitle', { name: clubName })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle value={view} onChange={changeView} />
          {canUpload && (
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              {t('uploadButton')}
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {canUpload ? t('clubGalleryEmptyAuthor') : t('galleryEmpty')}
        </p>
      ) : view === 'feed' ? (
        <ClubMediaFeed items={items} />
      ) : (
        <MusicMediaGrid items={items} />
      )}

      {showUploader && (
        <MusicMediaUploader
          preClubIds={[clubId]}
          onClose={() => setShowUploader(false)}
          onCreated={() => router.refresh()}
        />
      )}
    </section>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const t = useTranslations('musica.media');
  return (
    <div
      role="tablist"
      aria-label={t('viewToggleAria')}
      className="inline-flex overflow-hidden rounded-md border border-zinc-300 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900"
    >
      <ToggleButton
        active={value === 'feed'}
        onClick={() => onChange('feed')}
        label={t('viewFeed')}
        icon={<QueueListIcon className="h-4 w-4" />}
      />
      <ToggleButton
        active={value === 'grid'}
        onClick={() => onChange('grid')}
        label={t('viewGrid')}
        icon={<Squares2X2Icon className="h-4 w-4" />}
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? 'flex items-center gap-1.5 bg-amber-600 px-2.5 py-1.5 font-medium text-white'
          : 'flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

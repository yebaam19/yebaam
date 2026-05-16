'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArtistTagPicker } from '../../club/ArtistTagPicker';
import { AlbumTagPicker, type AlbumRef } from '../../media/AlbumTagPicker';
import {
  listClubsForCurrentUser,
  updateMusicMedia,
} from '../../../actions/music-media.actions';
import type { MusicMediaItem } from '../../../types/music-media.types';

interface ArtistRef {
  id: string;
  name: string;
  slug: string;
}

interface ClubRef {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  item: MusicMediaItem;
  onClose: () => void;
  /** Called after a successful save with the patched item so the parent list
   *  can update without a full refresh. */
  onSaved: (patched: MusicMediaItem) => void;
}

export function AdminMusicMediaEditDialog({ item, onClose, onSaved }: Props) {
  const t = useTranslations('musica.admin.mediaEditDialog');
  const [caption, setCaption] = useState(item.caption ?? '');
  const [artists, setArtists] = useState<ArtistRef[]>(item.artists);
  const [albums, setAlbums] = useState<AlbumRef[]>(
    item.albums.map((a) => ({ id: a.id, title: a.title, slug: a.slug })),
  );
  // Merge the user's allowed clubs with the item's currently-attached clubs so
  // admins can see and toggle every existing tag even if it falls outside the
  // default catalogue (category change, archived club, etc.).
  const [clubs, setClubs] = useState<ClubRef[]>(() => mergeClubs([], item.clubs));
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(
    new Set(item.clubs.map((c) => c.id)),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let canceled = false;
    (async () => {
      const res = await listClubsForCurrentUser();
      if (canceled || !res.ok) return;
      setClubs((prev) => mergeClubs(res.data, prev));
    })();
    return () => {
      canceled = true;
    };
  }, []);

  function handleSubmit() {
    setError(null);
    const nextClubIds = Array.from(selectedClubIds);
    startTransition(async () => {
      const res = await updateMusicMedia(item.id, {
        caption: caption.trim().length > 0 ? caption.trim() : null,
        artistIds: artists.map((a) => a.id),
        albumIds: albums.map((a) => a.id),
        clubIds: nextClubIds,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const clubsById = new Map(clubs.map((c) => [c.id, c]));
      onSaved({
        ...item,
        caption: caption.trim().length > 0 ? caption.trim() : null,
        artists,
        albums,
        clubs: nextClubIds
          .map((id) => clubsById.get(id))
          .filter((c): c is ClubRef => Boolean(c)),
      });
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {item.kind === 'photo' ? t('editPhoto') : t('editVideo')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {t('close')}
          </button>
        </header>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('descriptionLabel')}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder={t('descriptionPlaceholder')}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <ArtistTagPicker value={artists} onChange={setArtists} />

          <AlbumTagPicker value={albums} onChange={setAlbums} />

          {clubs.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('clubsLabel')}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {clubs.map((c) => {
                  const selected = selectedClubIds.has(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClubIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(c.id)) next.delete(c.id);
                            else next.add(c.id);
                            return next;
                          });
                        }}
                        className={
                          'rounded-full border px-2.5 py-1 text-xs ' +
                          (selected
                            ? 'border-rose-400 bg-rose-100 text-rose-900 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300')
                        }
                      >
                        {c.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && (
            <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {pending ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function mergeClubs(a: ClubRef[], b: ClubRef[]): ClubRef[] {
  const seen = new Set<string>();
  const out: ClubRef[] = [];
  for (const c of [...a, ...b]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  out.sort((x, y) => x.name.localeCompare(y.name));
  return out;
}

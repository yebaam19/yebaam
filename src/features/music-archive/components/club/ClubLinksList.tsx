'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { GlobeAltIcon, LinkIcon, PlusIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { addClubLink, removeClubLink } from '../../actions/club-links.actions';
import type { ClubLinkKind, ClubLinkRow } from '../../types/music.types';

interface Props {
  clubId: string;
  links: ClubLinkRow[];
  canEdit: boolean;
}

const KIND_ORDER: ClubLinkKind[] = ['venue', 'museum', 'shop', 'archive', 'related'];
const KIND_KEY: Record<ClubLinkKind, string> = {
  venue: 'kindVenue',
  museum: 'kindMuseum',
  shop: 'kindShop',
  archive: 'kindArchive',
  related: 'kindRelated',
};

export function ClubLinksList({ clubId, links, canEdit }: Props) {
  const t = useTranslations('musica');
  const [items, setItems] = useState(links);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = new Map<ClubLinkKind, ClubLinkRow[]>();
  for (const k of KIND_ORDER) grouped.set(k, []);
  for (const l of items) grouped.get(l.kind)?.push(l);

  function handleRemove(linkId: string) {
    if (!confirm(t('club.links.deleteConfirm'))) return;
    setError(null);
    startTransition(async () => {
      const res = await removeClubLink(linkId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems((prev) => prev.filter((l) => l.id !== linkId));
    });
  }

  function handleAdded(row: ClubLinkRow) {
    setItems((prev) => [...prev, row]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <div>
          {showForm ? (
            <AddLinkForm
              clubId={clubId}
              onCancel={() => setShowForm(false)}
              onAdded={handleAdded}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            >
              <PlusIcon className="h-4 w-4" /> {t('club.links.addCta')}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {items.length === 0 && !showForm && (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('club.links.empty')}
        </p>
      )}

      {KIND_ORDER.map((k) => {
        const ls = grouped.get(k) ?? [];
        if (ls.length === 0) return null;
        return (
          <section key={k}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t(`club.links.${KIND_KEY[k]}`)}
            </h3>
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {ls.map((l) => (
                <li key={l.id} className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 text-zinc-400">
                    {l.kind === 'archive' ? (
                      <LinkIcon className="h-5 w-5" />
                    ) : (
                      <GlobeAltIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-words text-sm font-medium text-amber-700 hover:underline dark:text-amber-300"
                    >
                      {l.label}
                    </a>
                    {l.description && (
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {l.description}
                      </p>
                    )}
                    <p className="mt-0.5 break-all text-xs text-zinc-500">{l.url}</p>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemove(l.id)}
                      disabled={pending}
                      className="text-zinc-400 hover:text-rose-600 disabled:opacity-40"
                      aria-label={t('club.links.delete')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AddLinkForm({
  clubId,
  onCancel,
  onAdded,
}: {
  clubId: string;
  onCancel: () => void;
  onAdded: (row: ClubLinkRow) => void;
}) {
  const t = useTranslations('musica');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<ClubLinkKind>('related');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await addClubLink(clubId, {
        label,
        url,
        kind,
        description: description.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onAdded(res.data);
      setLabel('');
      setUrl('');
      setDescription('');
    });
  }

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('club.links.labelLabel')}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as ClubLinkKind)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {KIND_ORDER.map((k) => (
            <option key={k} value={k}>
              {t(`club.links.${KIND_KEY[k]}`)}
            </option>
          ))}
        </select>
      </div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('club.links.descLabel')}
        rows={2}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !label.trim() || !url.trim()}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-40"
        >
          {pending ? t('club.links.saving') : t('club.links.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          {t('club.links.cancel')}
        </button>
      </div>
    </div>
  );
}

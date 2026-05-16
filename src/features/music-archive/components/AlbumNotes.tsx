'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  notes: string;
  /** When notes exceed this many characters, collapse and show a toggle. */
  collapseAfter?: number;
}

/** Long-form album description with a "Mostrar más" / "Ver menos" toggle so
 *  Wikipedia-style imports don't crowd out the rest of the page. Renders as a
 *  prose block — preserves single-line line breaks but doesn't try to be an
 *  HTML renderer (notes are plain text after `stripHtml` at import time). */
export function AlbumNotes({ notes, collapseAfter = 420 }: Props) {
  const t = useTranslations('musica');
  const [expanded, setExpanded] = useState(false);
  const isLong = notes.length > collapseAfter;
  const display = isLong && !expanded ? notes.slice(0, collapseAfter).trimEnd() + '…' : notes;

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-line break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {display}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          {expanded ? t('albumNotes.showLess') : t('albumNotes.showMore')}
        </button>
      )}
    </div>
  );
}

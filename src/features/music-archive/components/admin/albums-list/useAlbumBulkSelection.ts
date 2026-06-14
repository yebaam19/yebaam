'use client';

import { useState, useTransition } from 'react';
import { bulkToggleForTrade } from '../../../actions/albums.actions';
import type { AdminAlbumListItem } from '../../../types/music.types';

interface Options {
  rows: AdminAlbumListItem[];
  setRows: React.Dispatch<React.SetStateAction<AdminAlbumListItem[]>>;
}

/** Multi-select + bulk "for trade" mutation for the admin albums table.
 *  Sibling to `useAdminEntitySearch` — keeps the selection Set and the bulk
 *  transition out of the list component so it only has to render. */
export function useAlbumBulkSelection({ rows, setRows }: Options) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();
  const [bulkError, setBulkError] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelected((prev) => {
      const allSelected = rows.every((r) => prev.has(r.id));
      if (allSelected) return new Set();
      const next = new Set(prev);
      for (const r of rows) next.add(r.id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function applyBulkForTrade(forTrade: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkError(null);
    startBulkTransition(async () => {
      const res = await bulkToggleForTrade(ids, forTrade);
      if (!res.ok) {
        setBulkError(res.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (selected.has(r.id) ? { ...r, for_trade: forTrade } : r)),
      );
      setSelected(new Set());
    });
  }

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return {
    selected,
    toggleSelect,
    selectAllOnPage,
    clearSelection,
    applyBulkForTrade,
    allOnPageSelected,
    bulkPending,
    bulkError,
  };
}

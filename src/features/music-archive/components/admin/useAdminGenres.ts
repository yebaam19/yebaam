'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { createGenre, deleteGenre, updateGenre } from '../../actions/genres.actions';
import type { AdminGenreRow } from './admin-genres.types';

/**
 * State + server-action handlers for `AdminGenresList`: the row list, the
 * inline-edit draft fields, the create-form fields, and create/update/delete.
 * The component renders; this owns the behavior.
 */
export function useAdminGenres(initial: AdminGenreRow[]) {
  const t = useTranslations('musica.admin.genresList');
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftOrder, setDraftOrder] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [pending, startTransition] = useTransition();

  function beginEdit(row: AdminGenreRow) {
    setEditingId(row.id);
    setDraftName(row.name);
    setDraftDesc(row.description ?? '');
    setDraftOrder(String(row.sort_order));
    setError(null);
  }

  function saveEdit(row: AdminGenreRow) {
    setError(null);
    startTransition(async () => {
      const res = await updateGenre(row.id, {
        name: draftName,
        description: draftDesc.trim() ? draftDesc : null,
        sortOrder: Number(draftOrder) || row.sort_order,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) =>
        prev
          .map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  name: res.data.name,
                  description: res.data.description,
                  sort_order: res.data.sort_order,
                }
              : r,
          )
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    });
  }

  function handleDelete(row: AdminGenreRow) {
    if (!confirm(t('deleteConfirm', { name: row.name, count: row.club_count }))) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteGenre(row.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    });
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const res = await createGenre({
        name: newName,
        description: newDesc.trim() || undefined,
        sortOrder: 999,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) =>
        [
          ...prev,
          {
            id: res.data.id,
            slug: res.data.slug,
            name: res.data.name,
            description: res.data.description,
            sort_order: res.data.sort_order,
            club_count: 0,
          },
        ].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      );
      setCreating(false);
      setNewName('');
      setNewDesc('');
    });
  }

  return {
    rows,
    error,
    editingId,
    setEditingId,
    draftName,
    setDraftName,
    draftDesc,
    setDraftDesc,
    draftOrder,
    setDraftOrder,
    creating,
    setCreating,
    newName,
    setNewName,
    newDesc,
    setNewDesc,
    pending,
    beginEdit,
    saveEdit,
    handleDelete,
    handleCreate,
  };
}

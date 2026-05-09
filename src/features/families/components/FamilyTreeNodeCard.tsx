'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { FamilyPersonRow } from '../types/family.types';

export type FamilyTreeNodeData = {
  person: FamilyPersonRow;
  canDelete: boolean;
  onEdit?: (person: FamilyPersonRow) => void;
  onDelete?: (person: FamilyPersonRow) => void;
};

function formatYears(p: FamilyPersonRow): string {
  const b = p.birth_date ? new Date(p.birth_date).getUTCFullYear() : null;
  const d = p.death_date ? new Date(p.death_date).getUTCFullYear() : null;
  if (b && d) return `${b} – ${d}`;
  if (b) return `${b} –`;
  if (d) return `– ${d}`;
  return '';
}

export function FamilyTreeNodeCard({ data }: NodeProps) {
  const { person, canDelete, onEdit, onDelete } = data as FamilyTreeNodeData;
  const avatar = person.avatar_cf_image_id ? imageUrl(person.avatar_cf_image_id, 'avatar') : null;
  const isDeceased = Boolean(person.death_date);
  const years = formatYears(person);

  return (
    <div
      className={`group relative min-w-[180px] max-w-[220px] rounded-xl border bg-white shadow-sm dark:bg-zinc-900 ${
        isDeceased
          ? 'border-zinc-300 dark:border-zinc-700'
          : 'border-emerald-300 dark:border-emerald-800'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-400" />

      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(person);
            }}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Editar persona"
            title="Editar"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(person);
            }}
            className="rounded p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-800 dark:hover:bg-rose-900/40 dark:hover:text-rose-300"
            aria-label="Eliminar persona"
            title="Eliminar"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 p-3">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
            aria-hidden
          />
        ) : (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold ${
              isDeceased
                ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}
            aria-hidden
          >
            {person.full_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {person.full_name}
          </p>
          {years && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{years}</p>
          )}
          {isDeceased && (
            <span className="mt-1 inline-block rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              Fallecido/a
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-400" />
    </div>
  );
}

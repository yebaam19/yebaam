'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { resolveImage, imageUrl } from '@/lib/media/urls';
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
  const { person } = data as FamilyTreeNodeData;
  const isClaimed = Boolean(person.claimed_profile);
  const isDeceased = Boolean(person.death_date);
  const years = formatYears(person);

  const claimedAvatar = isClaimed
    ? resolveImage({ avatar_url: person.claimed_profile?.avatar_url ?? null }, 'avatar')
    : null;
  const personAvatar = person.avatar_cf_image_id
    ? imageUrl(person.avatar_cf_image_id, 'avatar')
    : null;
  const avatar = claimedAvatar ?? personAvatar;

  // Subtle, unified visual language — claim status comes through avatar ring,
  // deceased through muted tones. No saturated color cards.
  const cardClass = isClaimed
    ? 'border-blue-200 dark:border-blue-900'
    : 'border-zinc-200 dark:border-zinc-800';

  return (
    <div
      className={`group relative min-w-[180px] max-w-[220px] rounded-xl border bg-white shadow-sm transition hover:shadow-md dark:bg-zinc-900 ${cardClass}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-300 dark:!bg-zinc-600" />

      <div className="flex items-center gap-3 p-3">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className={`h-12 w-12 flex-shrink-0 rounded-full object-cover ${
              isClaimed ? 'ring-2 ring-blue-300 dark:ring-blue-700' : ''
            } ${isDeceased ? 'opacity-80 grayscale' : ''}`}
            aria-hidden
          />
        ) : (
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-medium ${
              isClaimed
                ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700'
                : isDeceased
                  ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
            aria-hidden
          >
            {person.full_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {person.full_name}
          </p>
          {years && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{years}</p>
          )}
          {isClaimed && person.claimed_profile?.username && (
            <p
              className="mt-0.5 truncate text-[11px] text-blue-600 dark:text-blue-300"
              title="Vinculado a un usuario de Yebaam"
            >
              ✓ @{person.claimed_profile.username}
            </p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-300 dark:!bg-zinc-600" />
    </div>
  );
}

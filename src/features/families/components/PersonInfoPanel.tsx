'use client';

import Link from 'next/link';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@/components/icons/heroicons-shim';
import { resolveImage, imageUrl } from '@/lib/media/urls';
import type { FamilyPersonRow } from '../types/family.types';

const GENDER_LABEL: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  unknown: 'Sin especificar',
};

interface Props {
  person: FamilyPersonRow | null;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (person: FamilyPersonRow) => void;
  onDelete: (person: FamilyPersonRow) => void;
  onAddParents: (person: FamilyPersonRow) => void;
}

export function PersonInfoPanel({ person, canDelete, onClose, onEdit, onDelete, onAddParents }: Props) {
  if (!person) return null;

  const isClaimed = Boolean(person.claimed_profile);
  const isDeceased = Boolean(person.death_date);

  const claimedAvatar = isClaimed
    ? resolveImage({ avatar_url: person.claimed_profile?.avatar_url ?? null }, 'avatar')
    : null;
  const personAvatar = person.avatar_cf_image_id ? imageUrl(person.avatar_cf_image_id, 'public') : null;
  const avatar = claimedAvatar ?? personAvatar;

  const fullClaimedName = isClaimed
    ? [person.claimed_profile?.first_name, person.claimed_profile?.last_name]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        role="dialog"
        aria-label={`Información de ${person.full_name}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className={`h-16 w-16 rounded-full object-cover ${isClaimed ? 'ring-2 ring-blue-400' : ''}`}
              />
            ) : (
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold ${
                  isClaimed
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 dark:bg-blue-900/40 dark:text-blue-300'
                    : isDeceased
                      ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}
                aria-hidden
              >
                {person.full_name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {person.full_name}
              </h2>
              {isClaimed && person.claimed_profile?.username && (
                <Link
                  href={`/${person.claimed_profile.username}`}
                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                >
                  <span aria-hidden>✓</span>
                  <span>@{person.claimed_profile.username}</span>
                </Link>
              )}
              {isDeceased && !isClaimed && (
                <span className="mt-1 inline-block rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  Fallecido/a
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 p-5 text-sm">
          {fullClaimedName && (
            <Field label="Nombre vinculado en Yebaam" value={fullClaimedName} />
          )}
          <Field label="Género" value={GENDER_LABEL[person.gender] ?? person.gender} />
          {person.birth_date && (
            <Field
              label="Nacimiento"
              value={
                new Date(person.birth_date).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }) + (person.birth_place ? ` · ${person.birth_place}` : '')
              }
            />
          )}
          {person.death_date && (
            <Field
              label="Defunción"
              value={
                new Date(person.death_date).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }) + (person.death_place ? ` · ${person.death_place}` : '')
              }
            />
          )}
          {person.bio && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Biografía</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {person.bio}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Acciones
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(person)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => onAddParents(person)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
            >
              <UserPlusIcon className="h-4 w-4" />
              Agregar padres
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(person)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-900/20"
              >
                <TrashIcon className="h-4 w-4" />
                Eliminar
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">{value}</p>
    </div>
  );
}

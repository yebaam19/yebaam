'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import { PawIcon } from '@/components/icons/PawIcon';
import { getPetsForProfileAction } from '@/features/pets/actions/pets.actions';
import type { PetRow } from '@/features/pets/types/pet.types';
import { PetMiniCard } from './PetMiniCard';
import { PetDetailModal } from './PetDetailModal';
import { PetEditorModal } from './editor/PetEditorModal';

interface UserPetsProps {
  userId: string;
  ownerUsername: string;
  isOwnProfile: boolean;
}

export default function UserPets({ userId, ownerUsername, isOwnProfile }: UserPetsProps) {
  const t = useTranslations('profile.pets');
  const searchParams = useSearchParams();
  const [pets, setPets] = useState<PetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [editingPet, setEditingPet] = useState<PetRow | null>(null);
  const [creating, setCreating] = useState(false);

  // Auto-open the detail modal when navigated to with `?pet=<slug>` (shared link).
  useEffect(() => {
    const slug = searchParams?.get('pet');
    if (!slug || pets.length === 0) return;
    const match = pets.find((p) => p.slug === slug);
    if (match && match.id !== selectedPetId) {
      setSelectedPetId(match.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pets]);

  const refresh = useCallback(async () => {
    const res = await getPetsForProfileAction(userId);
    if (res.ok) setPets(res.data);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) setLoading(true);
      const res = await getPetsForProfileAction(userId);
      if (!cancelled && res.ok) setPets(res.data);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <>
        <div className="rounded-2xl bg-white py-12 text-center shadow-sm dark:bg-zinc-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
            <PawIcon className="h-8 w-8 text-zinc-400" />
          </div>
          {isOwnProfile ? (
            <>
              <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t('emptyOwnTitle')}
              </h3>
              <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">{t('emptyOwnSubtitle')}</p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <PlusIcon className="h-4 w-4" />
                {t('addPet')}
              </button>
            </>
          ) : (
            <>
              <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t('emptyOtherTitle')}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('emptyOtherSubtitle')}</p>
            </>
          )}
        </div>
        {isOwnProfile && creating && (
          <PetEditorModal
            pet={null}
            onClose={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              void refresh();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {isOwnProfile && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <PlusIcon className="h-4 w-4" />
            {t('addPet')}
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pets.map((p) => (
          <PetMiniCard
            key={p.id}
            pet={p}
            isOwner={isOwnProfile}
            ownerUsername={ownerUsername}
            onOpen={() => setSelectedPetId(p.id)}
            onEdit={() => setEditingPet(p)}
          />
        ))}
      </div>

      {selectedPetId && (
        <PetDetailModal
          petId={selectedPetId}
          isOwner={isOwnProfile}
          ownerUsername={ownerUsername}
          onClose={() => setSelectedPetId(null)}
          onEdit={(pet) => {
            setSelectedPetId(null);
            setEditingPet(pet);
          }}
          onDeleted={() => {
            setSelectedPetId(null);
            void refresh();
          }}
        />
      )}

      {isOwnProfile && creating && (
        <PetEditorModal
          pet={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            void refresh();
          }}
        />
      )}

      {isOwnProfile && editingPet && (
        <PetEditorModal
          pet={editingPet}
          onClose={() => setEditingPet(null)}
          onSaved={() => {
            setEditingPet(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

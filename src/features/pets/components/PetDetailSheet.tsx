'use client';

import { useTranslations } from 'next-intl';
import type { PetRow } from '@/features/pets/types/pet.types';

interface PetDetailSheetProps {
  pet: PetRow;
}

function formatAge(dob: string | null, locale: string): string | null {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years -= 1;
  const dateLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(birth);
  if (years < 0) return dateLabel;
  return `${dateLabel} (${years}a)`;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
      <dt className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export function PetDetailSheet({ pet }: PetDetailSheetProps) {
  const t = useTranslations('profile.pets');
  const tSex = useTranslations('profile.pets.sex');
  const age = formatAge(pet.date_of_birth, 'es');

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t('dataSheet')}
        </h3>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label={t('fields.species')} value={pet.species} />
          <Field label={t('fields.breed')} value={pet.breed} />
          <Field label={t('fields.sex')} value={pet.sex === 'unknown' ? null : tSex(pet.sex)} />
          <Field label={t('fields.dateOfBirth')} value={age} />
          <Field label={t('fields.color')} value={pet.color} />
          <Field
            label={t('fields.weightKg')}
            value={pet.weight_kg != null ? `${pet.weight_kg} kg` : null}
          />
          <Field label={t('fields.microchipId')} value={pet.microchip_id} />
          <Field label={t('fields.vetContact')} value={pet.vet_contact} />
        </dl>
      </div>

      {(pet.is_vaccinated || pet.is_sterilized) && (
        <div className="flex flex-wrap gap-2">
          {pet.is_vaccinated && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {t('badges.vaccinated')}
            </span>
          )}
          {pet.is_sterilized && (
            <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              {t('badges.sterilized')}
            </span>
          )}
        </div>
      )}

      {pet.allergies && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {t('fields.allergies')}
          </h4>
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            {pet.allergies}
          </p>
        </div>
      )}

      {pet.about && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t('fields.about')}
          </h4>
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{pet.about}</p>
        </div>
      )}
    </div>
  );
}

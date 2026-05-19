'use client';

import { useTranslations } from 'next-intl';
import type { PetPrivacy, PetSex } from '@/features/pets/types/pet.types';

export interface PetFieldsFormState {
  name: string;
  species: string;
  breed: string;
  sex: PetSex;
  dateOfBirth: string; // yyyy-mm-dd
  color: string;
  weightKg: string;
  microchipId: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  allergies: string;
  vetContact: string;
  about: string;
  privacy: PetPrivacy;
}

interface PetFieldsFormProps {
  state: PetFieldsFormState;
  onChange: (next: PetFieldsFormState) => void;
}

function inputClasses() {
  return 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';
}

function labelClasses() {
  return 'mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300';
}

export function PetFieldsForm({ state, onChange }: PetFieldsFormProps) {
  const t = useTranslations('profile.pets');
  function set<K extends keyof PetFieldsFormState>(key: K, value: PetFieldsFormState[K]) {
    onChange({ ...state, [key]: value });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClasses()} htmlFor="pet-name">{t('fields.name')} *</label>
        <input
          id="pet-name"
          className={inputClasses()}
          value={state.name}
          onChange={(e) => set('name', e.target.value)}
          maxLength={80}
        />
      </div>

      <div>
        <label className={labelClasses()} htmlFor="pet-species">{t('fields.species')} *</label>
        <input
          id="pet-species"
          className={inputClasses()}
          value={state.species}
          onChange={(e) => set('species', e.target.value)}
          placeholder={t('placeholders.species')}
          maxLength={60}
        />
      </div>

      <div>
        <label className={labelClasses()} htmlFor="pet-breed">{t('fields.breed')}</label>
        <input
          id="pet-breed"
          className={inputClasses()}
          value={state.breed}
          onChange={(e) => set('breed', e.target.value)}
        />
      </div>

      <div>
        <label className={labelClasses()} htmlFor="pet-sex">{t('fields.sex')}</label>
        <select
          id="pet-sex"
          className={inputClasses()}
          value={state.sex}
          onChange={(e) => set('sex', e.target.value as PetSex)}
        >
          <option value="unknown">{t('sex.unknown')}</option>
          <option value="male">{t('sex.male')}</option>
          <option value="female">{t('sex.female')}</option>
        </select>
      </div>

      <div>
        <label className={labelClasses()} htmlFor="pet-dob">{t('fields.dateOfBirth')}</label>
        <input
          id="pet-dob"
          type="date"
          className={inputClasses()}
          value={state.dateOfBirth}
          onChange={(e) => set('dateOfBirth', e.target.value)}
        />
      </div>

      <div>
        <label className={labelClasses()} htmlFor="pet-color">{t('fields.color')}</label>
        <input
          id="pet-color"
          className={inputClasses()}
          value={state.color}
          onChange={(e) => set('color', e.target.value)}
        />
      </div>

      <div>
        <label className={labelClasses()} htmlFor="pet-weight">{t('fields.weightKg')}</label>
        <input
          id="pet-weight"
          type="number"
          min="0"
          step="0.1"
          className={inputClasses()}
          value={state.weightKg}
          onChange={(e) => set('weightKg', e.target.value)}
        />
      </div>

      <div>
        <label className={labelClasses()} htmlFor="pet-microchip">{t('fields.microchipId')}</label>
        <input
          id="pet-microchip"
          className={inputClasses()}
          value={state.microchipId}
          onChange={(e) => set('microchipId', e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClasses()} htmlFor="pet-vet">{t('fields.vetContact')}</label>
        <input
          id="pet-vet"
          className={inputClasses()}
          value={state.vetContact}
          onChange={(e) => set('vetContact', e.target.value)}
          placeholder={t('placeholders.vetContact')}
        />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <input
          id="pet-vaccinated"
          type="checkbox"
          className="h-4 w-4 rounded text-emerald-600"
          checked={state.isVaccinated}
          onChange={(e) => set('isVaccinated', e.target.checked)}
        />
        <label htmlFor="pet-vaccinated" className="text-sm text-zinc-700 dark:text-zinc-300">
          {t('badges.vaccinated')}
        </label>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <input
          id="pet-sterilized"
          type="checkbox"
          className="h-4 w-4 rounded text-emerald-600"
          checked={state.isSterilized}
          onChange={(e) => set('isSterilized', e.target.checked)}
        />
        <label htmlFor="pet-sterilized" className="text-sm text-zinc-700 dark:text-zinc-300">
          {t('badges.sterilized')}
        </label>
      </div>

      <div className="sm:col-span-2">
        <label className={labelClasses()} htmlFor="pet-allergies">{t('fields.allergies')}</label>
        <textarea
          id="pet-allergies"
          rows={2}
          className={inputClasses()}
          value={state.allergies}
          onChange={(e) => set('allergies', e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClasses()} htmlFor="pet-about">{t('fields.about')}</label>
        <textarea
          id="pet-about"
          rows={3}
          className={inputClasses()}
          value={state.about}
          onChange={(e) => set('about', e.target.value)}
          placeholder={t('placeholders.about')}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClasses()} htmlFor="pet-privacy">{t('fields.privacy')}</label>
        <select
          id="pet-privacy"
          className={inputClasses()}
          value={state.privacy}
          onChange={(e) => set('privacy', e.target.value as PetPrivacy)}
        >
          <option value="public">{t('privacy.public')} — {t('privacyHints.public')}</option>
          <option value="friends">{t('privacy.friends')} — {t('privacyHints.friends')}</option>
          <option value="private">{t('privacy.private')} — {t('privacyHints.private')}</option>
        </select>
      </div>
    </div>
  );
}

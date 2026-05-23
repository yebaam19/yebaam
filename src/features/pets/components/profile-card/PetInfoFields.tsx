'use client';

import type { ComponentType, SVGProps } from 'react';
import { useTranslations } from 'next-intl';
import { CakeIcon, CheckBadgeIcon, SparklesIcon } from '@/components/icons/heroicons-shim';
import { PawIcon } from '@/components/icons/PawIcon';
import type { PetRow } from '@/features/pets/types/pet.types';

interface Props {
  pet: PetRow;
}

type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

interface RowProps {
  Icon: IconType;
  label: string;
  value: string;
}

function Row({ Icon, label, value }: RowProps) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
        <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {value}
        </div>
      </div>
    </div>
  );
}

function calcYears(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let y = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) y -= 1;
  return y < 0 ? null : y;
}

export function PetInfoFields({ pet }: Props) {
  const t = useTranslations('profile.pets');
  const years = calcYears(pet.date_of_birth);

  const rows: RowProps[] = [
    { Icon: PawIcon as IconType, label: t('fields.species'), value: pet.species },
  ];

  if (pet.breed) {
    rows.push({ Icon: SparklesIcon as IconType, label: t('fields.breed'), value: pet.breed });
  }

  if (years != null) {
    rows.push({
      Icon: CakeIcon as IconType,
      label: t('fields.age'),
      value: t('fields.ageYears', { years }),
    });
  }

  rows.push({
    Icon: CheckBadgeIcon as IconType,
    label: t('fields.vaccinated'),
    value: pet.is_vaccinated ? t('fields.yes') : t('fields.no'),
  });

  return (
    <div className="grid grid-cols-1 gap-y-3 gap-x-5 border-y border-zinc-200 py-3 dark:border-zinc-800 sm:grid-cols-2">
      {rows.map((r) => (
        <Row key={r.label} {...r} />
      ))}
    </div>
  );
}

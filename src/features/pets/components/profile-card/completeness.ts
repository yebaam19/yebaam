import type { PetPhotoRow, PetRow } from '@/features/pets/types/pet.types';

export interface SectionState {
  filled: number;
  total: number;
}

export interface PetCompleteness {
  basicInfo: SectionState;
  health: SectionState;
  gallery: SectionState;
  percent: number;
  ready: boolean;
}

function bool(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  return Boolean(v);
}

export function getPetCompleteness(pet: PetRow, photos: PetPhotoRow[]): PetCompleteness {
  const basic: boolean[] = [
    bool(pet.name),
    bool(pet.species),
    bool(pet.breed),
    pet.sex !== 'unknown',
    bool(pet.date_of_birth),
    bool(pet.about),
  ];
  const health: boolean[] = [
    pet.is_vaccinated,
    pet.is_sterilized,
    bool(pet.weight_kg),
    bool(pet.microchip_id),
    bool(pet.vet_contact),
  ];
  const gallery: boolean[] = [bool(pet.cover_cf_image_id), photos.length >= 1, photos.length >= 3];

  const section = (arr: boolean[]): SectionState => ({
    filled: arr.filter(Boolean).length,
    total: arr.length,
  });

  const basicInfo = section(basic);
  const healthS = section(health);
  const galleryS = section(gallery);

  const ratio =
    (basicInfo.filled / basicInfo.total +
      healthS.filled / healthS.total +
      galleryS.filled / galleryS.total) /
    3;

  return {
    basicInfo,
    health: healthS,
    gallery: galleryS,
    percent: Math.round(ratio * 100),
    ready: basicInfo.filled === basicInfo.total && galleryS.filled >= 2,
  };
}

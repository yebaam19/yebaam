export type PetSex = 'male' | 'female' | 'unknown';
export type PetPrivacy = 'public' | 'friends' | 'private';

export interface PetRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex;
  date_of_birth: string | null;
  color: string | null;
  weight_kg: number | null;
  microchip_id: string | null;
  is_vaccinated: boolean;
  is_sterilized: boolean;
  allergies: string | null;
  vet_contact: string | null;
  about: string | null;
  cover_cf_image_id: string | null;
  privacy: PetPrivacy;
  created_at: string;
  updated_at: string;
}

export interface PetPhotoRow {
  id: string;
  pet_id: string;
  cf_image_id: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface PetVideoRow {
  id: string;
  pet_id: string;
  cf_stream_uid: string;
  thumbnail_cf_image_id: string | null;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface PetWithMedia extends PetRow {
  photos: PetPhotoRow[];
  videos: PetVideoRow[];
}

export interface CreatePetDto {
  name: string;
  species: string;
  breed?: string | null;
  sex?: PetSex;
  dateOfBirth?: string | null;
  color?: string | null;
  weightKg?: number | null;
  microchipId?: string | null;
  isVaccinated?: boolean;
  isSterilized?: boolean;
  allergies?: string | null;
  vetContact?: string | null;
  about?: string | null;
  coverCfImageId?: string | null;
  privacy?: PetPrivacy;
}

export interface UpdatePetDto extends Partial<CreatePetDto> {
  id: string;
}

export interface AddPetPhotoDto {
  petId: string;
  cfImageId: string;
  caption?: string | null;
}

export interface AddPetVideoDto {
  petId: string;
  cfStreamUid: string;
  thumbnailCfImageId?: string | null;
  caption?: string | null;
}

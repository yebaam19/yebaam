import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import type { PetRow, PetPhotoRow, PetVideoRow, PetWithMedia } from '../types/pet.types';

// RLS does all the visibility filtering — owner sees everything, viewers see
// public + friends-of-friends. We just call the table.
export const listPetsForProfile = cache(async (profileId: string): Promise<PetRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('pets')
    .select('*')
    .eq('owner_id', profileId)
    .order('created_at', { ascending: false });
  return (data as PetRow[] | null) ?? [];
});

export const getPetWithMedia = cache(async (petId: string): Promise<PetWithMedia | null> => {
  const client = await getServerClient();
  const { data: pet } = await client.from('pets').select('*').eq('id', petId).maybeSingle();
  if (!pet) return null;

  const [{ data: photos }, { data: videos }] = await Promise.all([
    client
      .from('pet_photos')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false }),
    client
      .from('pet_videos')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false }),
  ]);

  return {
    ...(pet as PetRow),
    photos: (photos as PetPhotoRow[] | null) ?? [],
    videos: (videos as PetVideoRow[] | null) ?? [],
  };
});

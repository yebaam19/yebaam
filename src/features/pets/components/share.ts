import { usePostStore } from '@/app/(app)/feed/post/stores/post.store';
import type { PetRow } from '@/features/pets/types/pet.types';

export function sharePetToFeed(pet: PetRow, ownerUsername: string, defaultText: string) {
  const url = `/${ownerUsername}?tab=mascotas&pet=${pet.slug}`;
  const text = `${defaultText}\n${url}`;
  usePostStore.getState().setPendingPostContent(text);
  usePostStore.getState().openCreateModal();
}

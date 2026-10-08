'use server';

import { leaderContactsSchema, leaderMediaSchema, leaderDeleteSchema } from '../../schemas/communityLeader.schema';
import { runPlanAction } from '../plans/_shared';
import { saveDirectoryRecord, deleteDirectoryRecord } from './_shared';

export async function saveLeaderContacts(input: unknown) {
  return runPlanAction(leaderContactsSchema, input, 'content', async ({ client }, value) => {
    let profileId: string | null = null;
    if (value.profileUsername) {
      const { data, error } = await client.from('profiles').select('id').eq('username', value.profileUsername).maybeSingle();
      if (error || !data) return { ok: false, error: 'El perfil seleccionado no está disponible.' };
      profileId = data.id;
    }
    return saveDirectoryRecord(client, 'community_leader_contacts', value, {
      email: value.email, phone: value.phone, social_links: value.socialLinks,
      profile_id: profileId, is_public: value.isPublic,
    });
  });
}
export async function saveLeaderMedia(input: unknown) {
  return runPlanAction(leaderMediaSchema, input, 'content', ({ client }, value) =>
    saveDirectoryRecord(client, 'community_leader_media', value, {
      leader_id: value.leaderId, slot: value.slot, asset_id: value.assetId,
    }));
}
export async function deleteLeaderContacts(input: unknown) {
  return runPlanAction(leaderDeleteSchema, input, 'content', ({ client }, value) =>
    deleteDirectoryRecord(client, 'community_leader_contacts', value));
}
export async function detachLeaderMedia(input: unknown) {
  return runPlanAction(leaderDeleteSchema, input, 'content', ({ client }, value) =>
    deleteDirectoryRecord(client, 'community_leader_media', value));
}

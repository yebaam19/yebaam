import 'server-only';

import type { Session } from '../actions/families-helpers';

/** Match the family document write gate before issuing external credentials. */
export async function canUploadFamilyDocument(session: Session, familyId: string): Promise<boolean> {
  const { data: family, error: familyError } = await session.client
    .from('families')
    .select('owner_id, member_can_add_documents')
    .eq('id', familyId)
    .maybeSingle();
  if (familyError || !family) return false;
  if (family.owner_id === session.userId) return true;

  const { data: member, error: memberError } = await session.client
    .from('family_members')
    .select('role')
    .eq('family_id', familyId)
    .eq('profile_id', session.userId)
    .maybeSingle();
  if (memberError || !member) return false;
  return member.role === 'admin' || (member.role === 'member' && family.member_can_add_documents === true);
}

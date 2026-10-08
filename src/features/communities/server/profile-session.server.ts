import 'server-only';
import { requireSession, type Session } from '../actions/_shared';
import type { ProfileCapability, ProfileCapabilities } from '../types/communityPlan.types';

export async function requireProfileSession(communityId: string, capability: ProfileCapability): Promise<
  { ok: true; session: Session } | { ok: false; status: 401 | 403; error: string }
> {
  const session = await requireSession();
  if (!session) return { ok: false, status: 401, error: 'Debes iniciar sesión.' };
  const { data, error } = await session.client.rpc('community_profile_capabilities', { target_community: communityId });
  if (error || !(data as ProfileCapabilities | null)?.[capability]) {
    return { ok: false, status: 403, error: 'No tienes permiso para realizar este cambio.' };
  }
  return { ok: true, session };
}

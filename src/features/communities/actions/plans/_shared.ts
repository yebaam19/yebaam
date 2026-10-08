import 'server-only';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { type ActionResult, type Session } from '../_shared';
import type { ProfileCapability } from '../../types/communityPlan.types';
import { requireProfileSession } from '../../server/profile-session.server';

export function planWriteError(code?: string): string {
  if (code === '40001') return 'El contenido cambió. Recarga la página antes de guardar.';
  if (code === '23505') return 'Este registro ya existe. Recarga para ver la versión guardada.';
  if (code === '42501') return 'No tienes permiso para realizar este cambio.';
  if (code === '23503' || code === '23514') return 'La sección o el eje seleccionado no es válido.';
  return 'No se pudo guardar el cambio. Inténtalo de nuevo.';
}

export async function runPlanAction<T extends { communityId: string }, R>(
  schema: z.ZodType<T>, input: unknown, capability: ProfileCapability,
  operation: (session: Session, value: T) => Promise<ActionResult<R>>,
  options: { revalidate?: boolean } = {},
): Promise<ActionResult<R>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa los campos y vuelve a intentarlo.' };
  try {
    const auth = await requireProfileSession(parsed.data.communityId, capability);
    if (!auth.ok) return { ok: false, error: auth.error };
    const result = await operation(auth.session, parsed.data);
    if (result.ok && options.revalidate !== false) revalidatePath('/feed/comunidades/[slug]', 'layout');
    return result;
  } catch {
    return { ok: false, error: 'No se pudo completar la operación. Inténtalo de nuevo.' };
  }
}

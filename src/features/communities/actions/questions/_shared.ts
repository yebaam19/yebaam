import 'server-only';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSession, type ActionResult } from '../_shared';
import { z as schema } from 'zod';
const resultSchema = schema.object({ id: schema.uuid(), version: schema.number().int().positive() });
type MutationResult = ActionResult<{ id: string; version: number }>;
function questionError(code?: string): string {
  if (code === '40001') return 'El contenido cambió. Recarga la página antes de guardar.';
  if (code === '42501') return 'No tienes permiso o el contenido ya no está disponible.';
  if (code === '23503') return 'Mueve las preguntas antes de eliminar la categoría.';
  if (code === '54000') return 'Alcanzaste el límite de preguntas por hora. Inténtalo más tarde.';
  if (code === '23514') return 'Revisa los campos, la categoría y el estado de la pregunta. Una FAQ necesita una respuesta oficial visible.';
  return 'No se pudo guardar. Tus cambios se conservan para reintentar.';
}
/** RPC derives identity and checks authority again under row locks. Never forwards user IDs. */
export async function runQuestionMutation<T>(
  validator: z.ZodType<T>, input: unknown, rpc: string,
  parameters: (value: T) => Record<string, unknown>,
): Promise<MutationResult> {
  const parsed = validator.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa los campos y confirma la acción cuando corresponda.' };
  try {
    const session = await requireSession();
    if (!session) return { ok: false, error: 'Inicia sesión para continuar.' };
    const { data, error } = await session.client.rpc(rpc, parameters(parsed.data));
    if (error) return { ok: false, error: questionError(error.code) };
    const saved = resultSchema.safeParse(data);
    if (!saved.success) return { ok: false, error: questionError() };
    revalidatePath('/feed/comunidades/[slug]', 'layout');
    return { ok: true, data: saved.data };
  } catch { return { ok: false, error: questionError() }; }
}

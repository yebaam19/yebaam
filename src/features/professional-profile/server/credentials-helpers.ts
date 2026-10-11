import 'server-only';

import { revalidatePath } from 'next/cache';

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function revalidateAdminQueue() {
  revalidatePath('/admin/professional-credentials');
}

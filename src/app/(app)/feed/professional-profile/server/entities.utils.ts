import { revalidatePath } from 'next/cache';

export function revalidateProfile() {
  revalidatePath('/feed/professional-profile/[username]', 'page');
}

export function emptyToNull<T>(v: T | undefined | ''): T | null {
  return v === undefined || v === '' ? null : (v as T);
}

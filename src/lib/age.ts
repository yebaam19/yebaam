/**
 * Age helpers for the anonymous-chat age gate.
 *
 * `birthDate` is the `profiles.birth_date` value — a `YYYY-MM-DD` DATE string,
 * a Date, or null when the user never provided one.
 *
 * **Unknown age is treated as under-13 on purpose.** A null or unparseable
 * birth date must never qualify for the 13+ "default ON" path — an account
 * with no proven age is gated like a minor until it sets one.
 */

/** Age in whole years, or null when the birth date is missing/unparseable. */
export function getAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;
  const dob = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/** True only when we can prove the user is 13 or older. Null/unknown ⇒ false. */
export function isAtLeast13(birthDate: string | Date | null | undefined): boolean {
  const age = getAge(birthDate);
  return age !== null && age >= 13;
}

/** Inverse of {@link isAtLeast13} — null/unknown counts as under-13. */
export function isUnder13(birthDate: string | Date | null | undefined): boolean {
  return !isAtLeast13(birthDate);
}

/** True only when we can prove the user is 18 or older. Null/unknown ⇒ false. */
export function isAtLeast18(birthDate: string | Date | null | undefined): boolean {
  const age = getAge(birthDate);
  return age !== null && age >= 18;
}

/**
 * Resolve whether a user may receive anonymous conversations.
 *
 * Mirrors the server-side logic in the `send_anonymous_chat_invite` RPC so the
 * UI and the database agree: an explicit choice always wins; absent a choice,
 * 13+ defaults ON and under-13 (or unknown age) defaults OFF.
 *
 * @param explicit  `profiles.allow_anonymous_chats` (null = "use age default")
 */
export function resolveAnonChatEnabled(
  explicit: boolean | null | undefined,
  birthDate: string | Date | null | undefined,
): boolean {
  if (typeof explicit === 'boolean') return explicit;
  return isAtLeast13(birthDate);
}


export function getUserInitials(name?: string | null): string {
  if (!name || name.trim() === '') {
    return 'U'; 
  }

  const cleanName = name.trim();
  
  const words = cleanName.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}
export function getFirstName(name?: string | null): string {
  if (!name || name.trim() === '') {
    return 'Usuario';
  }

  const cleanName = name.trim();
  const words = cleanName.split(/\s+/);
  
  return words[0];
}

/** Fields any user-shaped object may carry that contribute to a human name. */
export type NameParts = {
  firstName?: string | null;
  secondName?: string | null; // a.k.a. middle name
  lastName?: string | null;
  secondLastName?: string | null;
  displayName?: string | null;
  username?: string | null;
};

/**
 * Canonical human display name. Prefers the user's REAL name
 * (first · middle · last · second-last), then an explicit `displayName`,
 * then the `@username`, and finally a generic fallback.
 *
 * It deliberately NEVER returns the email (or an email-derived string): the
 * username is set to `email.split('@')[0]` at signup, so callers must always
 * route name display through here so a person's actual name wins over the
 * email-looking handle. Use this everywhere a name is shown to a human.
 */
export function getUserDisplayName(user?: NameParts | null): string {
  if (!user) return 'Usuario';
  const fullName = [user.firstName, user.secondName, user.lastName, user.secondLastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return fullName || user.displayName?.trim() || user.username?.trim() || 'Usuario';
}

/**
 * @deprecated Prefer {@link getUserDisplayName}, which considers the real name.
 * Kept as a thin delegate so existing callers automatically benefit when the
 * object they pass carries first/last name fields.
 */
export function getDisplayName(user?: NameParts | null): string {
  return getUserDisplayName(user);
}

export function formatUserInfo(user?: (NameParts & {
  avatar?: string | null;
}) | null) {
  const displayName = getDisplayName(user);
  
  return {
    displayName,
    firstName: getFirstName(displayName),
    initials: getUserInitials(displayName),
    avatar: user?.avatar || undefined,
  };
}

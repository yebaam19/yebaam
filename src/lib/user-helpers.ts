
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

export function getDisplayName(user?: { 
  username?: string | null;
} | null): string {
  if (!user) {
    return 'Usuario';
  }

  return user.username || 'Usuario';
}

export function formatUserInfo(user?: { 
  username?: string | null;
  avatar?: string | null;
} | null) {
  const displayName = getDisplayName(user);
  
  return {
    displayName,
    firstName: getFirstName(displayName),
    initials: getUserInitials(displayName),
    avatar: user?.avatar || undefined,
  };
}

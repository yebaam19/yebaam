'use client';

import { createContext, useContext } from 'react';

interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string;
}

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return context;
}

/** Safe version — returns null when used outside a CurrentUserProvider (e.g. on public routes with no session). */
export function useOptionalCurrentUser(): CurrentUser | null {
  return useContext(CurrentUserContext);
}

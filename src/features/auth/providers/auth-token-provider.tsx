'use client';

import { createContext, useContext } from 'react';

interface AuthTokenContextValue {
  token: string | null;
}

const AuthTokenContext = createContext<AuthTokenContextValue>({ token: null });

export function AuthTokenProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  return (
    <AuthTokenContext.Provider value={{ token }}>
      {children}
    </AuthTokenContext.Provider>
  );
}

export function useAuthToken() {
  const context = useContext(AuthTokenContext);
  if (context === undefined) {
    throw new Error('useAuthToken must be used within AuthTokenProvider');
  }
  return context;
}

'use client';

import { useEffect } from 'react';
import { AuthUser } from '../interfaces/auth.interfaces';
import { useAuthStore } from '../store/auth.store';

interface AuthProviderProps {
  user: AuthUser | null;
  children: React.ReactNode;
}

/**
 * Provider que sincroniza el estado de autenticación del servidor con Zustand
 * Debe ser usado en el layout raíz con los datos del servidor
 */
export function AuthProvider({ user, children }: AuthProviderProps) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Sincronizar el estado del servidor con el cliente
    setUser(user);
  }, [user, setUser]);

  return <>{children}</>;
}

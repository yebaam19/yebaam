'use client';

import { useState, useEffect } from 'react';
import { userProfileService, type UserProfile } from '../services/user-profile.service';
import { toast } from 'sonner';

/**
 * Hook para manejar el perfil del usuario autenticado
 */
export function useMyProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfil al montar
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userProfileService.getMyProfile();
      setProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar perfil';
      setError(errorMessage);
      console.error('[useMyProfile] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      const updatedProfile = await userProfileService.updateMyProfile(data);
      setProfile(updatedProfile);
      toast.success('Perfil actualizado exitosamente');
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar perfil';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    loadProfile();
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch,
  };
}

/**
 * Hook para obtener el perfil de cualquier usuario por username
 */
export function useUserProfile(username: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await userProfileService.getUserProfileByUsername(username);
        setProfile(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(errorMessage);
        console.error('[useUserProfile] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  return {
    profile,
    isLoading,
    error,
  };
}

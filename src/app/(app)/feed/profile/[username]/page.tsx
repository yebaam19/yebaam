'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowPathIcon, UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { profileService } from '@/features/profile/services/profile.service';
import type { UserProfile } from '@/features/profile/interfaces/profile.interfaces';
import { useFriendRequests } from '@/features/user/hooks/useFriendRequests';
import Avatar from '@/ui/Avatar';
import Link from 'next/link';

/**
 * Vista de perfil dentro del feed
 * Muestra información básica del usuario y acciones rápidas
 */
export default function FeedProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { sendRequest, isSending, sentRequests } = useFriendRequests();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await profileService.getProfileByUsername(username);
        setProfile(data);
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Error al cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username]);

  const handleSendRequest = async () => {
    if (!profile) return;
    try {
      await sendRequest(profile.userId);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const isRequestSent = sentRequests.some(req => req.toUserId === profile?.userId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
          Usuario no encontrado
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {error || 'El perfil que buscas no existe o no está disponible.'}
        </p>
        <Link
          href="/feed"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          Volver al Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Card del perfil */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
          {/* Cover Image */}
          <div className="h-48 bg-linear-to-r from-blue-500 to-purple-600 relative">
            {profile.coverUrl && (
              <img
                src={profile.coverUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20">
              <Avatar
                src={profile.avatarUrl}
                initials={`${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`}
                className="w-32 h-32 border-4 border-white dark:border-neutral-800 shadow-lg"
              />

              <div className="flex-1 text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  @{profile.username}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isRequestSent ? (
                  <button
                    disabled
                    className="px-6 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg font-semibold flex items-center gap-2"
                  >
                    <CheckIcon className="w-5 h-5" />
                    Solicitud Enviada
                  </button>
                ) : (
                  <button
                    onClick={handleSendRequest}
                    disabled={isSending}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    {isSending ? 'Enviando...' : 'Agregar Amigo'}
                  </button>
                )}

                <Link
                  href={`/${username}`}
                  className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white rounded-lg font-semibold transition-colors"
                >
                  Ver Perfil Completo
                </Link>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  Sobre mí
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {profile._count?.posts || 0}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Posts
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {profile._count?.following || 0}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Amigos
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {profile._count?.followers || 0}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Seguidores
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 space-y-3">
              {profile.residenceCity && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{profile.residenceCity}, {profile.residenceCountry}</span>
                </div>
              )}

              {profile.workPlace && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{profile.workPlace}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

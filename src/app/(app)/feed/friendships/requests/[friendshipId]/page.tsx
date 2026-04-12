/**
 * Página de detalle de solicitud de amistad
 * Muestra el perfil del solicitante/destinatario con opciones de acción
 * Diseño consistente con el resto de la plataforma
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  ArrowPathIcon, 
  CheckIcon, 
  XCircleIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { friendshipsService, FriendRequestActionsButtons } from '@/features/friendships';
import { profileService } from '@/features/profile/services/profile.service';
import type { UserProfile } from '@/features/profile/interfaces/profile.interfaces';
import { UserProfileComponent, PostsSidebar, UserPosts } from '@/features/profile/components';
import { useAuth } from '@/features/auth/context/auth-context';
import { toast } from 'sonner';

interface RequesterProfileData {
  friendshipId: string;
  requesterId: string;
  addresseeId: string;
  message?: string;
  sentAt: string;
  status: string;
  profile: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  profileType: 'requester' | 'addressee';
}

export default function FriendRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const friendshipId = params.friendshipId as string;

  const [data, setData] = useState<RequesterProfileData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | 'cancel' | null>(null);

  useEffect(() => {
    loadData();
  }, [friendshipId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Cargar datos de la solicitud
      const requestData = await friendshipsService.getRequesterProfile(friendshipId);
      setData(requestData);

      // Cargar perfil completo del usuario
      const profile = await profileService.getProfileByUsername(requestData.profile.username);
      setUserProfile(profile);
    } catch (err: any) {
      console.error('Error loading friend request:', err);
      setError(err.message || 'Error al cargar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!data) return;
    
    setActionLoading('accept');
    try {
      await friendshipsService.acceptFriendRequest(friendshipId);
      toast.success('¡Solicitud aceptada! Ahora son amigos 🎉');
      router.push('/feed');
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error(error.message || 'Error al aceptar la solicitud');
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    
    setActionLoading('reject');
    try {
      await friendshipsService.rejectFriendRequest(friendshipId);
      toast.success('Solicitud rechazada');
      router.push('/feed');
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      toast.error(error.message || 'Error al rechazar la solicitud');
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!data) return;
    
    setActionLoading('cancel');
    try {
      await friendshipsService.cancelFriendRequest(friendshipId);
      toast.success('Solicitud cancelada');
      router.push('/feed');
    } catch (error: any) {
      console.error('Error canceling friend request:', error);
      toast.error(error.message || 'Error al cancelar la solicitud');
      setActionLoading(null);
    }
  };

  const timeAgo = data?.sentAt
    ? formatDistanceToNow(new Date(data.sentAt), {
        addSuffix: true,
        locale: es,
      })
    : '';

  // Determinar si el usuario actual es el destinatario (puede aceptar/rechazar)
  // o el remitente (puede cancelar)
  const isAddressee = data?.profileType === 'requester';

  // Estados de carga y error con el estilo del producto
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ArrowPathIcon className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data || !userProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h2 className="mb-2 text-2xl font-bold">Solicitud no encontrada</h2>
        <p className="text-muted-foreground mb-4">
          {error || 'La solicitud que buscas no existe o no está disponible.'}
        </p>
        <button
          onClick={() => router.push('/feed')}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          Volver al Feed
        </button>
      </div>
    );
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        {/* Banner de contexto de solicitud (opcional, estilo Facebook) */}
        {data.message && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">
                  {isAddressee ? 'Mensaje de solicitud' : 'Tu mensaje'}
                </p>
                <p className="text-sm text-muted-foreground">&quot;{data.message}&quot;</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(data.sentAt), { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Perfil del usuario con botones de acción integrados */}
        <UserProfileComponent 
          user={userProfile} 
          loggedInUserId={currentUser?.id || ''}
          customActions={
            <FriendRequestActionsButtons
              isAddressee={isAddressee}
              actionLoading={actionLoading}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
            />
          }
        />

        {/* Sidebar y Posts del usuario */}
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="w-full md:w-full md:max-w-xs lg:max-w-sm">
            <PostsSidebar 
              user={userProfile} 
              loggedInUserId={currentUser?.id || ''} 
            />
          </div>
          <div className="flex-1 space-y-5">
            <Suspense fallback={<ArrowPathIcon className="h-6 w-6 animate-spin" />}>
              <UserPosts 
                userId={userProfile.userId} 
                isOwnProfile={false} 
              />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

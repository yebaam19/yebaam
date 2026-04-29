'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFriendRequests } from '../hooks/useFriendRequests';
import { 
  CheckIcon, 
  XMarkIcon, 
  UserGroupIcon,
  ClockIcon,
  PaperAirplaneIcon,
  InboxArrowDownIcon
} from '@/components/icons/heroicons-shim';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type TabType = 'received' | 'sent';

/**
 * Componente FriendRequestsList
 * 
 * Muestra las solicitudes de amistad recibidas y enviadas
 * Diseño moderno y consistente con el producto
 */
export function FriendRequestsList() {
  const { 
    receivedRequests,
    sentRequests,
    isLoadingRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  } = useFriendRequests();

  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleAccept = async (requestId: string) => {

    console.log(' [FriendRequestsList] Request ID:', requestId);

    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
 
      await acceptRequest(requestId);
    
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await rejectRequest(requestId);
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await cancelRequest(requestId);
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  // DESPUÉS de todos los hooks, calcular valores derivados
  const pendingReceived = receivedRequests.filter(req => req.status === 'pending');
  const pendingSent = sentRequests.filter(req => req.status === 'pending');
  const totalPending = pendingReceived.length + pendingSent.length;
  const currentRequests = activeTab === 'received' ? pendingReceived : pendingSent;

  // DESPUÉS de todos los hooks, hacer early returns
  if (isLoadingRequests) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (totalPending === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
      {/* Header con tabs integrados */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Solicitudes de amistad feed
        </h2>
        {totalPending > 0 && (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold rounded-full">
            {totalPending}
          </span>
        )}
      </div>

      {/* Tabs modernos */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'received'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <InboxArrowDownIcon className="w-5 h-5" />
          <span>Recibidas</span>
          {pendingReceived.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'received' 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {pendingReceived.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'sent'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <PaperAirplaneIcon className="w-5 h-5" />
          <span>Enviadas</span>
          {pendingSent.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'sent' 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {pendingSent.length}
            </span>
          )}
        </button>
      </div>

      {/* Lista de solicitudes */}
      <div className="space-y-3">
        {currentRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UserGroupIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {activeTab === 'received' 
                ? 'No tienes solicitudes pendientes' 
                : 'No has enviado solicitudes'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {activeTab === 'received' 
                ? 'Las solicitudes que recibas aparecerán aquí' 
                : 'Explora usuarios y envía solicitudes de amistad'}
            </p>
          </div>
        ) : (
          currentRequests.map((request) => {
            const isProcessing = processingRequests.has(request.requestId);
            
            // El backend siempre devuelve 'profile' (sender para recibidas, recipient para enviadas)
            const profile = (request as any).profile || request.senderProfile || request.recipientProfile;

            if (!profile) {
              console.warn('No profile found for request:', request);
              return null;
            }

            return (
              <div
                key={request.requestId}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Avatar */}
                <Link 
                  href={`/${profile.username}`}
                  className="shrink-0"
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-900">
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Información */}
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/${profile.username}`}
                    className="block hover:underline"
                  >
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {profile.firstName} {profile.lastName}
                    </p>
                  </Link>

                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(request.sentAt), { 
                        addSuffix: true,
                        locale: es 
                      })}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 shrink-0">
                  {activeTab === 'received' ? (
                    <>
                      {/* Aceptar */}
                      <button
                        onClick={() => handleAccept(request.requestId)}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-sm hover:shadow"
                        title="Aceptar solicitud"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>

                      {/* Rechazar */}
                      <button
                        onClick={() => handleReject(request.requestId)}
                        disabled={isProcessing}
                        className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Rechazar solicitud"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Cancelar solicitud enviada */}
                      <button
                        onClick={() => handleCancel(request.requestId)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{isProcessing ? 'Cancelando...' : 'Cancelar'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

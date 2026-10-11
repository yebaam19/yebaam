'use client';

import { useState } from 'react';
import { FriendRequestListRow } from './FriendRequestListRow';
import { useFriendRequests } from '../hooks/useFriendRequests';
import {
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ClockIcon,
  PaperAirplaneIcon,
  InboxArrowDownIcon
} from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';

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

  const t = useTranslations('friendships.friendRequestsList');
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
          {t('title')}
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
          <span>{t('tabReceived')}</span>
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
          <span>{t('tabSent')}</span>
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
                ? t('emptyReceivedTitle')
                : t('emptySentTitle')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {activeTab === 'received'
                ? t('emptyReceivedSubtitle')
                : t('emptySentSubtitle')}
            </p>
          </div>
        ) : (
          currentRequests.map((request) => (
            <FriendRequestListRow key={request.requestId} request={request}
              isProcessing={processingRequests.has(request.requestId)} activeTab={activeTab}
              handleAccept={handleAccept} handleReject={handleReject} handleCancel={handleCancel} />
          ))
        )}
      </div>
    </div>
  );
}

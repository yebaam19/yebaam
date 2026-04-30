'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  approveJoinRequest,
  declineJoinRequest,
  inviteByUsername,
} from '@/features/communities/actions/communities.actions';
import type { PendingJoinRequest } from '@/features/communities/server/communities.server';
import { CheckBadgeIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

interface CommunityAdminPanelProps {
  communityId: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  pendingRequests: PendingJoinRequest[];
}

export function CommunityAdminPanel({
  communityId,
  privacy,
  pendingRequests,
}: CommunityAdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const handleApprove = (requestId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await approveJoinRequest(requestId);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  };

  const handleDecline = (requestId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await declineJoinRequest(requestId);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  };

  const handleInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setError(null);
    setInviteResult(null);
    startTransition(async () => {
      const result = await inviteByUsername({ communityId, username: inviteUsername.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInviteResult(`Invitación enviada a @${result.data.invitee.username}`);
      setInviteUsername('');
      router.refresh();
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
        Panel de administración
      </h2>

      {privacy === 'SECRET' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Invitar usuario
          </h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="@usuario"
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending || !inviteUsername.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Invitar
            </button>
          </form>
          {inviteResult && (
            <p className="mt-2 text-sm text-green-700 dark:text-green-400">{inviteResult}</p>
          )}
        </div>
      )}

      {privacy === 'PRIVATE' && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Solicitudes pendientes ({pendingRequests.length})
          </h3>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay solicitudes pendientes.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {req.avatar ? (
                      <Image
                        src={req.avatar}
                        alt={req.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {req.name}
                      </p>
                      {req.username && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{req.username}
                        </p>
                      )}
                      {req.message && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {req.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      disabled={isPending}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(req.id)}
                      disabled={isPending}
                      className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                      aria-label="Rechazar"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {privacy === 'PUBLIC' && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Esta comunidad es pública — cualquier usuario puede unirse libremente.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { CheckIcon, XMarkIcon, ClockIcon } from '@/components/icons/heroicons-shim';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/lib/utils/date-fns-locale';
import { useTranslations } from 'next-intl';
import type { FriendRequest } from '../services/friend-request.service';

type Props = {
  request: FriendRequest;
  isProcessing: boolean;
  activeTab: 'received' | 'sent';
  handleAccept: (id: string) => Promise<void>;
  handleReject: (id: string) => Promise<void>;
  handleCancel: (id: string) => Promise<void>;
};

export function FriendRequestListRow({ request, isProcessing, activeTab, handleAccept, handleReject, handleCancel }: Props) {
  const t = useTranslations('friendships.friendRequestsList');
  const dateLocale = useDateFnsLocale();
  
  // El backend siempre devuelve 'profile' (sender para recibidas, recipient para enviadas)
  const profile = request.profile || request.senderProfile || request.recipientProfile;

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
              unoptimized
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
              locale: dateLocale
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
              title={t('acceptTitle')}
            >
              <CheckIcon className="w-4 h-4" />
            </button>

            {/* Rechazar */}
            <button
              onClick={() => handleReject(request.requestId)}
              disabled={isProcessing}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
              title={t('rejectTitle')}
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
              <span className="hidden sm:inline">{isProcessing ? t('cancelling') : t('cancelLabel')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

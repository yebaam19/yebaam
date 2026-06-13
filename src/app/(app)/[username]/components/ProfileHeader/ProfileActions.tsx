import {
  PencilIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  ClockIcon,
  CheckIcon,
} from '@/components/icons/heroicons-shim';
import type { FriendshipStatus } from '../ProfileHeader';

interface ProfileActionsProps {
  isOwnProfile: boolean;
  friendshipStatus: FriendshipStatus;
  onEditProfile: () => void;
  onAddFriend: () => void;
  onCancelRequest: () => void;
  onRemoveFriend: () => void;
  onMessage: () => void;
}

export default function ProfileActions({
  isOwnProfile,
  friendshipStatus,
  onEditProfile,
  onAddFriend,
  onCancelRequest,
  onRemoveFriend,
  onMessage,
}: ProfileActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {isOwnProfile ? (
        <button
          onClick={onEditProfile}
          className="group flex items-center gap-2.5 px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <PencilIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Editar perfil
        </button>
      ) : (
        <>
          {/* Botón de Amistad */}
          {friendshipStatus === 'none' && (
            <button
              onClick={onAddFriend}
              className="group flex items-center gap-2.5 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <UserPlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Agregar amigo
            </button>
          )}

          {friendshipStatus === 'pending' && (
            <button
              onClick={onCancelRequest}
              className="group flex items-center gap-2.5 px-6 py-3.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 hover:scale-105 transform transition-all duration-300 shadow-lg"
            >
              <ClockIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Solicitud enviada
            </button>
          )}

          {friendshipStatus === 'friends' && (
            <button
              onClick={onRemoveFriend}
              className="group flex items-center gap-2.5 px-6 py-3.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:scale-105 transform transition-all duration-300 shadow-lg"
            >
              <CheckIcon className="w-5 h-5" />
              <span className="group-hover:hidden">Amigos</span>
              <span className="hidden group-hover:flex items-center gap-1.5">
                <UserMinusIcon className="w-5 h-5" />
                Eliminar
              </span>
            </button>
          )}

          {/* Botón de Mensaje */}
          <button
            onClick={onMessage}
            className="group flex items-center gap-2.5 px-6 py-3.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 hover:scale-105 transform transition-all duration-300 shadow-lg"
          >
            <ChatBubbleLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Mensaje
          </button>

          {/* Botón de Más opciones */}
          <button className="group flex items-center justify-center w-12 h-12 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 hover:scale-105 transform transition-all duration-300 shadow-lg">
            <EllipsisHorizontalIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}
    </div>
  );
}

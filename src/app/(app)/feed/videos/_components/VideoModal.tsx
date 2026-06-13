'use client';

import { UserIcon } from '@/components/icons/heroicons-shim';
import { AuthUser } from '@/features/auth';
import { ProfileVideo } from '@/features/profile/services/profile-media.service';
import MediaReactionButton from '@/features/profile/components/media/MediaReactionButton';
import MediaCommentsSection from '@/features/profile/components/media/MediaCommentsSection';
import Image from 'next/image';

interface VideoModalProps {
  video: ProfileVideo;
  user: AuthUser | null;
  onClose: () => void;
}

export default function VideoModal({ video, user, onClose }: VideoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10"
      >
        ✕
      </button>
      <div
        className="max-w-6xl w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2">
          {/* Video Player */}
          <div className="bg-black flex items-center justify-center relative min-h-[400px] md:min-h-[600px]">
            <video
              src={video.url}
              controls
              autoPlay
              className="w-full h-full"
              poster={video.thumbnailUrl}
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </div>

          {/* Video Info */}
          <div className="p-6 flex flex-col">
            {/* User info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username || 'User'}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{user?.username}
                </p>
              </div>
            </div>

            {/* Caption */}
            {video.caption && (
              <div className="mb-6">
                <p className="text-gray-800 dark:text-gray-200">
                  {video.caption}
                </p>
              </div>
            )}

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reactions */}
            <div className="mb-6">
              <MediaReactionButton
                entityType="video"
                entityId={video.id}
                initialLikesCount={video.likesCount || 0}
              />
            </div>

            {/* Comments Section */}
            <div className="flex-1 overflow-hidden">
              <MediaCommentsSection
                entityType="video"
                entityId={video.id}
                initialCommentsCount={video.commentsCount || 0}
              />
            </div>

            {/* Date and visibility */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {new Date(video.uploadedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                  {video.visibility === 'public' ? 'Público' :
                   video.visibility === 'friends' ? 'Amigos' : 'Solo yo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

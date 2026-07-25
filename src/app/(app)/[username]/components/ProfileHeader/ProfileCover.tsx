'use client';

import { useState } from 'react';
import { CameraIcon } from '@/components/icons/heroicons-shim';

interface ProfileCoverProps {
  coverPhoto?: string | null;
  isOwnProfile: boolean;
}

export default function ProfileCover({ coverPhoto, isOwnProfile }: ProfileCoverProps) {
  const [isHoveringCover, setIsHoveringCover] = useState(false);

  return (
    <div
      className="relative h-[350px] overflow-hidden group"
      onMouseEnter={() => setIsHoveringCover(true)}
      onMouseLeave={() => setIsHoveringCover(false)}
    >
      {/* Cover Image */}
      {coverPhoto ? (
        <div className="relative w-full h-full">
          <img
            src={coverPhoto}
            alt="Cover"
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
            style={{
              minHeight: '100%',
              minWidth: '100%',
            }}
            decoding="async"
          />
          {/* Overlay para mejorar contraste con botones */}
          <div className="absolute inset-0 bg-black/5" />
        </div>
      ) : (
        <div className="w-full h-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
          {/* Patrón decorativo animado */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-2xl" />
          </div>
        </div>
      )}

      {/* Gradient overlay para mejor legibilidad */}
      <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/40" />

      {/* Edit Cover Button */}
      {isOwnProfile && (
        <button
          className={`
            absolute top-6 right-6
            flex items-center gap-2.5 px-6 py-3
            bg-white/10 dark:bg-black/20
            backdrop-blur-xl
            border border-white/30
            rounded-2xl font-semibold text-white text-sm
            shadow-2xl
            hover:bg-white/20 dark:hover:bg-black/30
            hover:scale-105
            transform transition-all duration-300
            ${isHoveringCover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          `}
        >
          <CameraIcon className="w-5 h-5" />
          Editar portada
        </button>
      )}
    </div>
  );
}

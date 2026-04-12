'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';

interface MessageNotificationProps {
  senderName: string;
  senderAvatar: string;
  message: string;
  onClose: () => void;
  onClick?: () => void;
}

export default function MessageNotification({
  senderName,
  senderAvatar,
  message,
  onClose,
  onClick,
}: MessageNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 10);

    // Auto cerrar después de 5 segundos
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      handleClose();
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 transition-all duration-300 cursor-pointer z-50",
        isVisible && !isLeaving ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            className="h-10 w-10"
            src={senderAvatar}
            initials={senderName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-primary-600 dark:border-neutral-800" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
              {senderName}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
            {message}
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 bg-neutral-100 dark:bg-neutral-700 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-primary-600 animate-progress"
          style={{ 
            animation: 'progress 5s linear forwards'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

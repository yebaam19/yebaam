'use client';

import { useState } from 'react';
import PageMessengerPanel from './PageMessengerPanel';
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim';

interface PageMessagesButtonProps {
  pageId: string;
  unreadCount?: number;
}

/**
 * Botón flotante para abrir el panel de mensajes de la página
 * Usar en el detalle de la página o en el dashboard de administración
 */
export function PageMessagesButton({ pageId, unreadCount = 0 }: PageMessagesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" />
        <span className="font-medium">Mensajes</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal de mensajería */}
      <PageMessengerPanel
        pageId={pageId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

/**
 * Ejemplo de uso en una página de detalle:
 * 
 * import { PageMessagesButton } from '@/features/pages/components/messages/PageMessagesButton';
 * 
 * export default function PageDetailPage({ params }: { params: { id: string } }) {
 *   return (
 *     <div>
 *       <h1>Detalle de Página</h1>
 *       
 *       // Botón para abrir mensajes
 *       <PageMessagesButton pageId={params.id} unreadCount={5} />
 *     </div>
 *   );
 * }
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim';

/**
 * El panel arrastra `PageMessengerChatView → usePageMessagesWebSocket → socket.io-client`.
 * Importado estáticamente, ese árbol entraba en el bundle inicial de
 * /paginas/[slug] para TODO visitante, aunque el panel sólo lo abre el
 * propietario. Cargarlo bajo demanda lo saca de la ruta. `ssr: false` porque
 * abre un WebSocket: no hay nada que prerrenderizar.
 */
const PageMessengerPanel = dynamic(() => import('./PageMessengerPanel'), {
  ssr: false,
});

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

      {/* Modal de mensajería — sólo se descarga al abrirlo. El panel ya hacía
          `if (!isOpen) return null`, así que montarlo condicionalmente no cambia
          el comportamiento. */}
      {isOpen && (
        <PageMessengerPanel
          pageId={pageId}
          isOpen
          onClose={() => setIsOpen(false)}
        />
      )}
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

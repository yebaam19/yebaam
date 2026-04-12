# Componentes de Mensajería de Páginas

Sistema completo de chat que permite a los propietarios de páginas gestionar mensajes de clientes en tiempo real.

## 🎨 Componentes Principales

### `PageMessagesButton`
Botón flotante que abre el panel de mensajes. Muestra un badge con el conteo de mensajes no leídos.

```tsx
import { PageMessagesButton } from '@/features/pages/components/messages';

function PageDetailView({ page }: { page: Page }) {
  return (
    <div>
      {/* Tu contenido de la página */}
      <PageMessagesButton pageId={page.id} unreadCount={5} />
    </div>
  );
}
```

**Props:**
- `pageId: string` - ID de la página
- `unreadCount?: number` - Cantidad de mensajes no leídos (opcional, default: 0)

---

### `PageMessengerPanel`
Modal principal que contiene el sistema completo de mensajería.

```tsx
import { PageMessengerPanel } from '@/features/pages/components/messages';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Abrir Chat</button>
      <PageMessengerPanel
        pageId="123"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

**Props:**
- `pageId: string` - ID de la página
- `isOpen: boolean` - Controla si el modal está visible
- `onClose: () => void` - Callback cuando se cierra el modal

---

### `PageMessengerSidebar`
Lista de conversaciones con búsqueda y badges de mensajes no leídos.

**Características:**
- 🔍 Búsqueda en tiempo real por nombre de usuario o último mensaje
- 📊 Contadores de mensajes no leídos
- 🎨 Avatares con gradientes generativos
- ⏱️ Timestamps relativos ("hace 5 minutos")
- 💡 Estados de loading y empty
- 🌙 Soporte para dark mode

---

### `PageMessengerChatView`
Vista de chat completa con mensajes, input y funcionalidad en tiempo real.

**Características:**
- 💬 Burbujas de mensajes (azul para página, gris para usuario)
- ✓ Receipts de lectura (✓ enviado, ✓✓ leído)
- 📱 Auto-scroll al recibir nuevos mensajes
- ⌨️ Indicador de "está escribiendo..."
- 🔌 WebSocket en tiempo real
- 📝 Textarea con Enter para enviar, Shift+Enter para nueva línea
- 👁️ Marcado automático como leído al abrir
- 🔴 Indicador de estado de conexión

---

### `PageMessagesTest`
Componente simple de testing para verificar funcionalidad sin el modal completo.

```tsx
import { PageMessagesTest } from '@/features/pages/components/messages';

function TestPage() {
  return <PageMessagesTest pageId="123" />;
}
```

## 🔧 Integración con Hooks

Los componentes utilizan los siguientes hooks del sistema:

### Hooks de React Query
```tsx
import { usePageMessages } from '@/features/pages/hooks/usePageMessages';

// Obtener conversaciones
const { data: conversations } = usePageConversations(pageId, {
  page: 1,
  limit: 50,
  includeArchived: false
});

// Obtener mensajes de una conversación
const { data: messages } = useConversationMessages(pageId, conversationId, {
  page: 1,
  limit: 50
});

// Enviar mensaje como página
const sendMessage = useSendMessageAsPage(pageId);
sendMessage.mutate({
  conversationId: '...',
  message: 'Hola!',
  messageType: MessageType.TEXT
});

// Marcar como leído
const markAsRead = useMarkMessagesAsRead(pageId);
markAsRead.mutate(conversationId);
```

### Hook de WebSocket
```tsx
import { usePageMessagesWebSocket } from '@/features/pages/hooks/usePageMessagesWebSocket';

const { isConnected, subscribeToConversation, emitTyping } = usePageMessagesWebSocket({
  pageId: '123',
  onNewMessage: (message) => {
    console.log('Nuevo mensaje:', message);
  },
  onTyping: ({ conversationId, isTyping }) => {
    console.log('Usuario escribiendo:', isTyping);
  }
});
```

## 📁 Estructura de Archivos

```
client/src/features/pages/
├── components/messages/
│   ├── PageMessagesButton.tsx       ← Botón flotante
│   ├── PageMessengerPanel.tsx       ← Modal principal
│   ├── PageMessengerSidebar.tsx     ← Lista de conversaciones
│   ├── PageMessengerChatView.tsx    ← Vista de chat
│   ├── PageMessagesTest.tsx         ← Componente de testing
│   ├── index.ts                     ← Exports
│   └── README.md                    ← Este archivo
├── interfaces/
│   ├── page-message.interface.ts
│   └── page-conversation.interface.ts
├── services/
│   └── page-messages.service.ts
└── hooks/
    ├── usePageMessages.ts
    └── usePageMessagesWebSocket.ts
```

## 🚀 Ejemplo Completo de Integración

```tsx
// En tu componente de detalle de página
import { PageMessagesButton } from '@/features/pages/components/messages';
import { usePageConversations } from '@/features/pages/hooks/usePageMessages';

export function PageDetailView({ page }: { page: Page }) {
  // Obtener conteo de no leídos
  const { data: conversations } = usePageConversations(page.id, {
    page: 1,
    limit: 1 // Solo necesitamos el conteo
  });

  const unreadCount = conversations?.conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  ) ?? 0;

  return (
    <div className="relative">
      {/* Tu contenido existente */}
      <div className="page-header">
        <h1>{page.name}</h1>
      </div>

      <div className="page-content">
        {/* ... */}
      </div>

      {/* Botón de mensajes - flotante en la esquina */}
      <PageMessagesButton
        pageId={page.id}
        unreadCount={unreadCount}
      />
    </div>
  );
}
```

## 🎯 Características del Sistema

### Consistencia Visual
Los componentes siguen exactamente el mismo diseño que el módulo de chat existente en `/components/chat/`, garantizando una experiencia de usuario consistente en toda la plataforma.

### Arquitectura
- **Backend**: DDD/Hexagonal con separación de capas
- **Frontend**: React Query para estado + WebSocket para tiempo real
- **Comunicación**: REST API + Socket.IO

### Endpoints Backend
- `GET /api/pages/:pageId/conversations` - Lista de conversaciones
- `GET /api/pages/:pageId/messages/:conversationId` - Mensajes
- `POST /api/pages/:pageId/messages` - Usuario envía mensaje
- `POST /api/pages/:pageId/messages/send-as-page` - Página responde
- `PATCH /api/pages/:pageId/messages/:conversationId/read` - Marcar leído

### WebSocket Namespace
- `/pages/messages` - Namespace dedicado
- Eventos: `message:new`, `messages:read`, `message:typing`
- Rooms: `conversation:*`, `page:*:inbox`, `user:*:inbox`

## 🔜 Próximos Pasos

1. **Integración**: Añadir `PageMessagesButton` a la vista de detalle de páginas
2. **Permisos**: Implementar guards para verificar ownership
3. **Multimedia**: Soporte para imágenes y archivos
4. **Búsqueda**: Búsqueda global de mensajes
5. **Notificaciones**: Integrar con sistema de notificaciones
6. **Mobile**: Optimizar para dispositivos móviles

## 📚 Documentación Adicional

Ver `CHAT-TESTING-GUIDE.md` en la raíz del proyecto para instrucciones completas de testing y debugging.

## 🐛 Debugging

### Ver estado de WebSocket
Los componentes incluyen logging en consola:
```
[PageMessengerChatView] Nueva conexión WebSocket
[PageMessengerChatView] Nuevo mensaje recibido: {...}
```

### Inspeccionar React Query Cache
Usa React Query Devtools:
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// En tu app
<ReactQueryDevtools initialIsOpen={false} />
```

### Verificar autenticación
El token JWT debe estar en `localStorage`:
```javascript
console.log(localStorage.getItem('token'));
```

# 💬 Módulo de Comentarios

Sistema completo de comentarios con WebSocket en tiempo real.

##  Estructura

```
src/app/(app)/feed/comments/
├── interfaces/
│   └── comment.interfaces.ts      # Types: Comment, CreateCommentDTO, etc.
├── services/
│   └── comment.service.ts         # API calls: create, update, delete, getByPost
├── store/
│   └── comment.store.ts           # Zustand store (sin devtools)
├── hooks/
│   └── useCommentSocket.ts        # WebSocket: comment_added, comment_updated, comment_deleted
├── components/
│   ├── CommentTextarea.tsx        # Textarea auto-resize
│   ├── SubmitButton.tsx           # Botón enviar
│   ├── CommentAuthorAvatar.tsx    # Avatar usuario
│   ├── CommentInput.tsx           # ⭐ Input principal (crear comentario)
│   ├── CommentHeader.tsx          # Header: avatar + nombre + timestamp
│   ├── CommentContent.tsx         # Contenido con modo edición
│   ├── CommentActions.tsx         # Dropdown: Editar, Eliminar
│   ├── CommentItem.tsx            # ⭐ Item individual (muestra comentario)
│   ├── CommentSkeleton.tsx        # Loading skeleton
│   ├── EmptyComments.tsx          # Estado vacío
│   └── CommentList.tsx            # ⭐ Lista completa (orquesta todo)
└── index.ts                       # Barrel exports
```

##  Componentes Principales

### 1. `<CommentInput />` - Crear comentario
```tsx
<CommentInput 
  postId="123" 
  placeholder="Escribe un comentario..."
  onCommentCreated={() => console.log('Creado')}
/>
```

### 2. `<CommentItem />` - Mostrar comentario
```tsx
<CommentItem comment={comment} />
```

### 3. `<CommentList />` - Lista completa
```tsx
<CommentList 
  postId="123"
  showInput={true}
  maxHeight="600px"
/>
```

##  WebSocket Events

El hook `useCommentSocket()` escucha:

- **`comment_added`** - Nuevo comentario (cualquier usuario)
- **`comment_updated`** - Comentario editado
- **`comment_deleted`** - Comentario eliminado

**Payload esperado del backend:**

```typescript
// comment_added
{
  comment: Comment,
  postId: string,
  userId: string
}

// comment_updated
{
  comment: Comment,
  postId: string,
  userId: string,
  oldContent: string
}

// comment_deleted
{
  commentId: string,
  postId: string,
  userId: string
}
```

##  Endpoints del Backend

### Crear comentario
```
POST /comments
Body: { postId: string, content: string, parentId?: string }
Response: Comment
```

### Actualizar comentario
```
PUT /comments/:id
Body: { content: string }
Response: Comment
```

### Eliminar comentario
```
DELETE /comments/:id
Response: void
```

### Listar comentarios de un post
```
GET /comments/post/:postId
Query: { page?, limit?, sortBy?, parentId? }
Response: {
  comments: Comment[],
  total: number,
  page: number,
  limit: number,
  hasMore: boolean
}
```

### Obtener comentario por ID
```
GET /comments/:id
Response: Comment
```

##  Formato de Comment

```typescript
interface Comment {
  id: string;
  postId: string;
  content: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: string;  // ISO 8601
  updatedAt: string;
  
  // Opcionales
  parentId?: string | null;
  replies?: Comment[];
  repliesCount?: number;
  likesCount?: number;
  isLiked?: boolean;
  isEdited?: boolean;
}
```

##  Funcionalidades Implementadas

-  Crear comentarios
-  Editar comentarios (solo autor)
-  Eliminar comentarios (solo autor) con confirmación
-  Validación (máximo 500 caracteres)
-  Loading states
-  Error handling
-  WebSocket real-time
-  Auto-resize textarea
-  Skeleton loading
-  Empty state
-  Responsive design
-  Dark mode support

##  Cómo Probar

### 1. **Arrancar el backend**
```bash
# Implementa los endpoints de comentarios
# Configura WebSocket namespace 'postsSocket'
# Emite eventos: comment_added, comment_updated, comment_deleted
```

### 2. **Navegar a la página de detalle**
```
http://localhost:3000/[username]/posts/[postId]
```

### 3. **Casos de prueba:**

 **Crear comentario**
- Escribir texto en el input
- Click en botón enviar
- Verificar que aparece en la lista

 **Editar comentario**
- Click en menú (⋯)
- Seleccionar "Editar"
- Modificar texto
- Guardar cambios

 **Eliminar comentario**
- Click en menú (⋯)
- Seleccionar "Eliminar"
- Confirmar

 **Real-time (múltiples usuarios)**
- Abrir 2 navegadores con usuarios diferentes
- Crear comentario en uno
- Verificar que aparece en el otro automáticamente

 **Estados**
- Loading skeleton al cargar
- Empty state cuando no hay comentarios
- Error handling

##  Debugging

### Ver eventos WebSocket en consola:
```javascript
// Los logs incluyen:
// 💬 [useCommentSocket] Comentario agregado
// ✏️ [useCommentSocket] Comentario actualizado  
// 🗑️ [useCommentSocket] Comentario eliminado
//  [CommentInput] Comentario creado
//  [CommentItem] Comentario editado/eliminado
```

### Verificar estado del store:
```javascript
// En DevTools console:
const store = useCommentStore.getState();
console.log('Comentarios por post:', store.commentsByPost);
console.log('Loading states:', store.loadingStates);
```

## 🎨 Estilos

- Tailwind CSS v4
- Dark mode automático
- Animaciones suaves
- Responsive
- Skeleton loading con shimmer

##  Próximas Mejoras

- [ ] Respuestas anidadas (replies)
- [ ] Menciones @username
- [ ] Reacciones a comentarios
- [ ] Paginación infinita
- [ ] Ordenar por (newest, oldest, popular)
- [ ] Edición rich text
- [ ] Adjuntar imágenes
- [ ] Notificaciones push

## 📚 Uso en otros componentes

```tsx
// Importar componentes
import { CommentList, CommentInput } from '@/app/(app)/feed/comments';

// Usar en cualquier página
<CommentList postId={postId} />

// O solo el input
<CommentInput postId={postId} />
```

---

**Estado:**  **Listo para probar**

**Pendiente:** Backend (endpoints + WebSocket)

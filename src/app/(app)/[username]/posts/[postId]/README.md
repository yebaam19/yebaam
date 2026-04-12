#  Post Detail Page

Vista de detalle individual de un post, similar a Facebook.

##  Características

-  URL amigable: `/{username}/posts/{postId}`
-  Vista completa del post con PostCard
-  Botón de "Volver" en el header
-  Loading skeleton mientras carga
-  Manejo de errores (post no encontrado, error de carga)
-  Sección de comentarios (placeholder)
-  Responsive design
-  Dark mode support

## 🔗 Navegación

### Desde PostCard
El timestamp del post es ahora un link clickeable:
```tsx
<Link href={`/${post.author.username}/posts/${post.id}`}>
  {timeAgo} {/* "hace 1 minuto" */}
</Link>
```

### Ejemplo de URL
```
http://localhost:3000/fflower.moreno.939/posts/pfbid02naDt1y6y7RFRJDF8LqK4nvR48XY4QsCyGLRZidv29S1sriqG9muEbDXfCCrVZkzil
```

## 📂 Estructura de Archivos

```
src/app/(app)/[username]/posts/[postId]/
└── page.tsx          # Página de detalle del post
```

##  Flujo de Datos

```
1. Usuario hace click en timestamp
2. Next.js navega a /[username]/posts/[postId]
3. useEffect detecta postId en params
4. fetchPostById(postId) obtiene el post del backend
5. Store actualiza currentPost
6. PostCard se renderiza con los datos
```

## 🎨 Componentes Utilizados

- **PostCard** - Renderiza el post completo
- **ArrowLeftIcon** - Botón de volver
- **Loading Skeleton** - Animación de carga
- **Error States** - Manejo de errores

##  Próximas Mejoras

- [ ] Sistema de comentarios completo
- [ ] Compartir post (copiar link, redes sociales)
- [ ] Posts relacionados/sugeridos
- [ ] Navegación entre posts (anterior/siguiente)
- [ ] SEO metadata dinámico
- [ ] Open Graph tags para compartir
- [ ] Breadcrumbs navigation

##  Notas Técnicas

### Client Component
Usa `'use client'` porque necesita:
- useParams() para leer URL params
- useRouter() para navegación
- usePostStore() para estado
- useEffect() para carga de datos

### Estado Global
El post se guarda en `currentPost` del store para:
- Evitar prop drilling
- Mantener consistencia
- Facilitar actualizaciones en tiempo real

### Limpieza
El post se mantiene en `currentPost` hasta que se navega a otro post.
Considera agregar cleanup en unmount si es necesario.


┌─────────────────────────────────────────────────┐
│  1. Usuario ve post en Feed                     │
│     "hace 1 minuto · publico"                   │
└─────────────────┬───────────────────────────────┘
                  │ Click en timestamp
                  ↓
┌─────────────────────────────────────────────────┐
│  2. Navega a URL del post                       │
│     /fflower.moreno.939/posts/pfbid02na...      │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│  3. Página carga el post                        │
│     - fetchPostById(postId)                     │
│     - Muestra skeleton mientras carga           │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│  4. Renderiza vista de detalle                  │
│     ┌─────────────────────────────────────┐    │
│     │ ← Volver  Publicación de Flower     │    │
│     └─────────────────────────────────────┘    │
│     ┌─────────────────────────────────────┐    │
│     │ [PostCard con post completo]        │    │
│     │ - Avatar, nombre, timestamp         │    │
│     │ - Contenido completo                │    │
│     │ - Media (imágenes/videos)           │    │
│     │ - Reacciones, comentarios, shares   │    │
│     └─────────────────────────────────────┘    │
│     ┌─────────────────────────────────────┐    │
│     │ Comentarios                          │    │
│     │ (Próximamente)                       │    │
│     └─────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘


proximos 
Comentarios completos - Sistema de comentarios funcional
Compartir - Copiar link, compartir en redes sociales
SEO - Meta tags dinámicos con contenido del post
Open Graph - Preview cuando se comparte en redes
Posts relacionados - Sugerencias al final
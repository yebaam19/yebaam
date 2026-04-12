ESCENARIO 1: TÚ creas un post
═══════════════════════════════════════════════════════
CreatePostModal
    ↓ (onClick)
createPost(data) [STORE]
    ↓
postService.create(data) [SERVICE]
    ↓
Backend guarda y retorna post
    ↓
Store: posts = [newPost, ...posts] ← ACTUALIZACIÓN INMEDIATA
    ↓
React re-renderiza MyRecentPosts 
    ↓
¡VES TU POST SIN REFRESCAR! 


ESCENARIO 2: OTRO USUARIO crea un post
═══════════════════════════════════════════════════════
Usuario B crea post
    ↓
Backend: socket.emit('post_created', newPost)
    ↓
usePostSocket recibe evento (en tu navegador)
    ↓
handlePostCreated() llama a addPostToList(newPost)
    ↓
Store: posts = [newPost, ...posts] ← ACTUALIZACIÓN INMEDIATA
    ↓
React re-renderiza FeedTimeline 
    ↓
¡VES EL POST DE OTROS SIN REFRESCAR! 
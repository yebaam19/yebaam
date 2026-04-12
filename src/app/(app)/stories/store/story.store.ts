import { create } from 'zustand';
import { storyService, type Story, type UserStoriesDto } from '../services/story.service';

interface StoryState {
  // Stories del feed (agrupadas por usuario)
  friendsStories: UserStoriesDto[];
  myStories: Story[];
  isLoading: boolean;
  error: string | null;

  // Estado del editor
  isCreating: boolean;

  // Acciones - API calls
  fetchFriendsStories: () => Promise<void>;
  fetchMyStories: () => Promise<void>;
  createStory: (formData: FormData) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  viewStory: (storyId: string) => Promise<void>;
  
  // Acciones - WebSocket
  addStory: (story: Story) => void;
  removeStory: (storyId: string) => void;
  incrementViewCount: (storyId: string) => void;

  // Draft management
  clearDraft: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  // Estado inicial
  friendsStories: [],
  myStories: [],
  isLoading: false,
  error: null,
  isCreating: false,

  /**
   * Obtener historias de amigos (agrupadas por usuario)
   */
  fetchFriendsStories: async () => {
    set({ isLoading: true, error: null });
    try {
      const stories = await storyService.getFriendsStories();
      set({ 
        friendsStories: stories,
        isLoading: false 
      });
    } catch (error) {
      console.error('[STORY STORE] Error fetching friends stories:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar historias',
        isLoading: false 
      });
    }
  },

  /**
   * Obtener mis historias activas
   */
  fetchMyStories: async () => {
    set({ isLoading: true, error: null });
    try {
      const stories = await storyService.getMyStories();
      set({ 
        myStories: stories,
        isLoading: false 
      });
    } catch (error) {
      console.error('[STORY STORE] Error fetching my stories:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar mis historias',
        isLoading: false 
      });
    }
  },

  /**
   * Crear nueva story
   * FormData debe contener:
   * - type: 'image' | 'video'
   * - file: File
   * - caption?: string (opcional)
   */
  createStory: async (formData: FormData) => {
    set({ isCreating: true, error: null });
    try {
      const file = formData.get('file') as File;
      const type = formData.get('type') as 'image' | 'video';
      const caption = formData.get('caption') as string | null;

      if (!file || !type) {
        throw new Error('Archivo y tipo son requeridos');
      }

      // 1. Generar presigned URL
      console.log('[STORY STORE] Generating presigned URL...');
      const presignedData = await storyService.generatePresignedUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        mediaType: type,
      });

      // 2. Subir archivo a S3
      console.log('[STORY STORE] Uploading to S3...');
      await storyService.uploadToS3(presignedData.uploadUrl, file);

      // 3. Obtener dimensiones del archivo si es imagen
      let width: number | undefined;
      let height: number | undefined;
      let duration: number | undefined;

      if (type === 'image') {
        const img = await createImageBitmap(file);
        width = img.width;
        height = img.height;
      } else if (type === 'video') {
        // Para video, necesitarías usar un elemento <video> temporal
        // Por ahora lo dejamos undefined
      }

      // 4. Crear historia en el backend
      console.log('[STORY STORE] Creating story in backend...');
      const newStory = await storyService.createStory({
        mediaUrl: presignedData.cloudFrontUrl,
        s3Key: presignedData.s3Key,
        type,
        caption: caption || undefined,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
        duration,
      });

      // 5. Agregar a mis historias
      set(state => ({
        myStories: [newStory, ...(Array.isArray(state.myStories) ? state.myStories : [])],
        isCreating: false,
      }));

      console.log('[STORY STORE] Story created successfully:', newStory);
    } catch (error) {
      console.error('[STORY STORE] Error creating story:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear historia',
        isCreating: false 
      });
      throw error;
    }
  },

  /**
   * Eliminar historia
   */
  deleteStory: async (storyId: string) => {
    try {
      await storyService.deleteStory(storyId);
      
      // Remover de mis historias
      set(state => ({
        myStories: (Array.isArray(state.myStories) ? state.myStories : []).filter(story => story.id !== storyId)
      }));

      console.log('[STORY STORE] Story deleted:', storyId);
    } catch (error) {
      console.error('[STORY STORE] Error deleting story:', error);
      throw error;
    }
  },

  /**
   * Marcar historia como vista
   */
  viewStory: async (storyId: string) => {
    try {
      await storyService.viewStory(storyId);
      
      // El backend retorna la historia actualizada, pero por ahora
      // solo incrementamos localmente
      get().incrementViewCount(storyId);

      console.log('[STORY STORE] Story viewed:', storyId);
    } catch (error) {
      console.error('[STORY STORE] Error viewing story:', error);
      // No throw para que no afecte la UX
    }
  },

  /**
   * [WebSocket] Agregar nueva historia al feed
   */
  addStory: (story: Story) => {
    set(state => {
      const safeFriendsStories = Array.isArray(state.friendsStories) ? state.friendsStories : [];
      
      // Verificar si ya existe el usuario en friendsStories
      const userIndex = safeFriendsStories.findIndex(
        us => us.userId === story.userId
      );

      if (userIndex >= 0) {
        // Usuario ya existe, agregar historia
        const updatedFriendsStories = [...safeFriendsStories];
        updatedFriendsStories[userIndex] = {
          ...updatedFriendsStories[userIndex],
          stories: [story, ...updatedFriendsStories[userIndex].stories],
          unviewedCount: updatedFriendsStories[userIndex].unviewedCount + 1,
          lastStoryAt: story.createdAt,
        };

        return { friendsStories: updatedFriendsStories };
      } else {
        // Usuario nuevo, crear entrada
        // Nota: Necesitaríamos los datos del usuario, por ahora usamos placeholders
        const newUserStories: UserStoriesDto = {
          userId: story.userId,
          username: 'Unknown', // TODO: Obtener del socket event
          fullName: 'Unknown User',
          stories: [story],
          unviewedCount: 1,
          lastStoryAt: story.createdAt,
        };

        return {
          friendsStories: [newUserStories, ...safeFriendsStories]
        };
      }
    });
  },

  /**
   * [WebSocket] Remover historia expirada
   */
  removeStory: (storyId: string) => {
    set(state => ({
      myStories: (Array.isArray(state.myStories) ? state.myStories : []).filter(s => s.id !== storyId),
      friendsStories: (Array.isArray(state.friendsStories) ? state.friendsStories : [])
        .map(userStories => ({
          ...userStories,
          stories: userStories.stories.filter(s => s.id !== storyId),
        }))
        .filter(us => us.stories.length > 0), // Remover usuarios sin historias
    }));
  },

  /**
   * [WebSocket] Incrementar contador de vistas
   */
  incrementViewCount: (storyId: string) => {
    set(state => ({
      myStories: (Array.isArray(state.myStories) ? state.myStories : []).map(story =>
        story.id === storyId
          ? { ...story, viewCount: story.viewCount + 1 }
          : story
      ),
      friendsStories: (Array.isArray(state.friendsStories) ? state.friendsStories : []).map(userStories => ({
        ...userStories,
        stories: userStories.stories.map(story =>
          story.id === storyId
            ? { ...story, viewCount: story.viewCount + 1 }
            : story
        ),
      })),
    }));
  },

  /**
   * Limpiar draft (compatibilidad con UI actual)
   */
  clearDraft: () => {
    // Actualmente no necesitamos draft en el store,
    // se maneja en el componente local
    console.log('[STORY STORE] clearDraft called');
  },
}));

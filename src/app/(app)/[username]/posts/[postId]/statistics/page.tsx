'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { postService } from '@/app/(app)/feed/post';
import { useReactionSocket } from '@/app/(app)/feed/reacions';
import { REACTION_CONFIGS, ReactionType } from '@/app/(app)/feed/reacions/interfaces/reaction.interfaces';
import type { PostStatisticsResponse } from '@/app/(app)/feed/post/interfaces/statistics.interfaces';
import {
  StatisticsHeader,
  StatisticsSummary,
  ReactionTabs,
  ReactionUserList,
} from './components';

/**
 * Página de estadísticas del post
 * Muestra información detallada sobre reacciones, comentarios y alcance
 * Similar a Facebook cuando haces click en "X personas han reaccionado"
 * 
 * ⚠️ SOLO ACCESIBLE PARA EL AUTOR DEL POST
 */
export default function PostStatisticsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.postId as string;
  
  // Estado para las estadísticas del backend
  const [statistics, setStatistics] = useState<PostStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Activar escucha de eventos de reacciones en tiempo real
  useReactionSocket();

  // Tab activo para filtrar reacciones
  const [activeTab, setActiveTab] = useState<'all' | ReactionType>('all');

  // Cargar estadísticas del backend y verificar permisos
  useEffect(() => {
    const loadStatistics = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Primero, obtener información básica del post para verificar autoría
        const post = await postService.getById(postId);
        
        // Verificar que el usuario actual sea el autor del post
        if (post.author.id !== user.id) {
          console.warn('[PostStatistics] Usuario no autorizado. Redirigiendo...');
          router.push(`/${params.username}/posts/${postId}`);
          return;
        }
        
        // Si es el autor, cargar las estadísticas
        const data = await postService.getStatistics(postId);
        console.log('[PostStatistics] Datos del backend:', data);
        setStatistics(data);
        setIsAuthorized(true);
      } catch (error) {
        console.error('[PostStatistics] Error cargando estadísticas:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar estadísticas');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId && user) {
      loadStatistics();
    }
  }, [postId, user, router, params.username]);

  // Obtener lista de usuarios según el filtro activo
  const getFilteredUsers = () => {
    if (!statistics) return [];
    
    const { topReactions } = statistics.statistics.reactions;
    
    if (activeTab === 'all') {
      // Combinar todos los usuarios de todas las reacciones
      return topReactions.flatMap(reaction => 
        reaction.users.map(user => ({
          ...user,
          reactionType: reaction.type,
        }))
      );
    }
    
    // Filtrar usuarios por tipo de reacción
    const reactionData = topReactions.find(r => r.type === activeTab);
    return reactionData?.users.map(user => ({
      ...user,
      reactionType: activeTab,
    })) || [];
  };

  const filteredUsers = getFilteredUsers();

  // Datos para los componentes
  const totalReactions = statistics?.statistics.reactions.total || 0;
  const totalComments = statistics?.statistics.comments?.total || 0;
  const totalShares = statistics?.statistics.shares?.total || 0;
  const totalViews = statistics?.statistics.views?.total;
  const reactionCounts = statistics?.statistics.reactions.counts || {
    LIKE: 0,
    LOVE: 0,
    HAHA: 0,
    WOW: 0,
    SAD: 0,
    ANGRY: 0,
  };

  // Mensaje de estado vacío según el tab
  const getEmptyMessage = () => {
    if (activeTab === 'all') {
      return 'Aún no hay reacciones en esta publicación';
    }
    const config = REACTION_CONFIGS[activeTab];
    return `Nadie ha reaccionado con ${config.label}`;
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'No se pudieron cargar las estadísticas'}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-primary-600 hover:underline"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <StatisticsHeader
        title="Estadísticas de la publicación"
        subtitle={`Post: ${postId.slice(0, 8)}...`}
        onBack={() => router.back()}
        onClose={() => router.back()}
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Resumen de estadísticas */}
        <StatisticsSummary
          totalReactions={totalReactions}
          totalComments={totalComments}
          totalShares={totalShares}
          totalViews={totalViews}
        />

        {/* Sección de Reacciones */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm">
          {/* Header de reacciones */}
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reacciones ({totalReactions})
            </h2>
          </div>

          {/* Tabs de tipos de reacción */}
          <ReactionTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalReactions={totalReactions}
            reactionCounts={reactionCounts}
          />

          {/* Lista de usuarios que reaccionaron */}
          <ReactionUserList
            users={filteredUsers}
            emptyMessage={getEmptyMessage()}
          />
        </div>
      </div>
    </div>
  );
}

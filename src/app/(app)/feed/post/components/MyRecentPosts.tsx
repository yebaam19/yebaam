'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { featureFlags } from '@/config/featureFlags';
import { usePostStore } from '../stores/post.store';
import { useAuth } from '@/features/auth/context/auth-context';
import PostCard from './PostCard';


export default function MyRecentPosts() {
  const { user } = useAuth();
  const hasLoadedPosts = useRef(false);
  

  const posts = usePostStore((state) => state.posts);
  const isLoading = usePostStore((state) => state.isLoading);
  const fetchMyPosts = usePostStore((state) => state.fetchMyPosts);

  const myPosts = useMemo(() => {

    
    const filtered = posts.filter(post => {
      const isMyPost = post.author.id === user?.id;
      if (isMyPost) {
        
      }
      return isMyPost;
    });
    
    
    return filtered;
  }, [posts, user?.id]);
  
  const lastPost = myPosts[0] || null;
  
  


  // Cargar mis posts al montar el componente (SOLO UNA VEZ)
  useEffect(() => {
    if (user?.id && posts.length === 0 && !hasLoadedPosts.current) {

      hasLoadedPosts.current = true;
      fetchMyPosts({ limit: 10 });
    }
  }, [user?.id]); // Solo depende de user?.id

  // No mostrar en producción (feature flag)
  if (!featureFlags.showMyRecentPosts) {
    return null;
  }

  // Skeleton loader
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-4/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
              <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
              <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No renderizar nada si no hay posts
  if (!lastPost) {
 
    return null;
  }

  // Vista con posts

  
  return (
    <div className="space-y-4">
      {/* Header con contador */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Tu última publicación
          </h2>
          {myPosts.length > 1 && (
            <Link 
              href={`/${user?.username}/posts`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              (+{myPosts.length - 1} más)
            </Link>
          )}
        </div>
      </div>

      {/* Renderizar el último post */}
      <PostCard post={lastPost} />
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { Article, ArticleStatus } from '../types';

export interface ArticleAdminPayload {
  schoolId?: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  category?: string | null;
  tags: string[];
  coverImageUrl?: string | null;
  videoUrl?: string | null;
  status: ArticleStatus;
  publishedAt?: string | null;
}

export function useArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(() => {
    setLoading(true);
    api.get<{ ok: boolean; data: Article[] }>('/articles/admin')
      .then((response) => {
        setArticles(response.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar artículos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const createArticle = useCallback(async (payload: ArticleAdminPayload) => {
    await api.post('/articles', payload);
    fetchArticles();
  }, [fetchArticles]);

  const updateArticle = useCallback(async (id: string, payload: ArticleAdminPayload) => {
    await api.patch(`/articles/${id}`, payload);
    fetchArticles();
  }, [fetchArticles]);

  const publishArticle = useCallback(async (id: string) => {
    await api.patch(`/articles/${id}/publish`);
    fetchArticles();
  }, [fetchArticles]);

  const archiveArticle = useCallback(async (id: string) => {
    await api.patch(`/articles/${id}/archive`);
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles,
    createArticle,
    updateArticle,
    publishArticle,
    archiveArticle,
  };
}

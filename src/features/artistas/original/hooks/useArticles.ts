import { useApiQuery } from "./useApiQuery";
import type { Article, Paginated } from "../types";

export function useArticles(query = "") {
  return useApiQuery<Paginated<Article>>(`/articles${query}`, [query]);
}

export function useArticleDetail(slug: string) {
  return useApiQuery<Article>(`/articles/${slug}`, [slug]);
}

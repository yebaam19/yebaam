export type QuestionCategory = {
  id: string; community_id: string; title: string; position: number; is_published: boolean; version: number;
};
export type CommunityQuestion = {
  id: string; community_id: string; author_id: string; author_name: string | null;
  category_id: string | null; title: string; body: string; is_published: boolean;
  is_closed: boolean; is_faq: boolean; hidden_at: string | null; moderation_reason: string;
  version: number; created_at: string; updated_at: string;
};
export type QuestionAnswer = {
  id: string; community_id: string; question_id: string; author_id: string | null; author_name: string | null;
  body: string; is_published: boolean; hidden_at: string | null; moderation_reason: string;
  version: number; created_at: string; updated_at: string;
};
export type QuestionCursor = { id: string; createdAt: string };
export type QuestionPage<T> = { items: T[]; nextCursor: QuestionCursor | null };
export type CategoryPage = { items: QuestionCategory[]; nextCursor: { id: string; position: number } | null };

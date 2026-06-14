export interface AdminGenreRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  club_count: number;
}

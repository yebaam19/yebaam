import { useApiQuery } from "./useApiQuery";
import type { EventItem, Paginated } from "../types";

export function useEvents(query = "") {
  return useApiQuery<Paginated<EventItem>>(`/events${query}`, [query]);
}

export function useEventDetail(slug: string) {
  return useApiQuery<EventItem>(`/events/${slug}`, [slug]);
}

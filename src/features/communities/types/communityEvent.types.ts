export type EventCover = { id: string; title: string; media_id: string; deleted_at?: string | null };
export type CommunityEvent = {
  id: string; community_id: string; title: string; description: string; starts_at: string; ends_at: string;
  location: string; virtual_url: string; organizer: string; registration_info: string; registration_url: string;
  cover_asset_id: string | null; cover: EventCover | null; rsvp_enabled: boolean; is_published: boolean;
  is_cancelled: boolean; version: number;
};
export type EventCursor = { id: string; startsAt: string };
export type EventPage = { items: CommunityEvent[]; nextCursor: EventCursor | null };

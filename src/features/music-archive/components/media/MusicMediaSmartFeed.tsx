'use client';

import type { Route } from 'next';
import type { MusicMediaItem } from '../../types/music-media.types';
import { MusicMediaTrendingRow } from './MusicMediaTrendingRow';

interface Props {
  items: MusicMediaItem[];
  /** Cap the trending row when N items are passed. Default 12. */
  trendingLimit?: number;
  /** Cap each per-club row. Default 8. */
  perClubLimit?: number;
  /** Threshold to split into per-club rows: must have items from ≥ this many
   *  distinct clubs. Default 2. */
  minClubsForGrouping?: number;
}

/** Pick the latest items across all clubs as the headline trending row. */
function pickTrending(items: MusicMediaItem[], limit: number): MusicMediaItem[] {
  const sorted = [...items].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return sorted.slice(0, limit);
}

/** Bucket items by club. An item with multiple clubs appears in each bucket. */
function bucketByClub(items: MusicMediaItem[]): Map<string, {
  clubId: string;
  clubSlug: string;
  clubName: string;
  items: MusicMediaItem[];
}> {
  const buckets = new Map<string, {
    clubId: string;
    clubSlug: string;
    clubName: string;
    items: MusicMediaItem[];
  }>();
  for (const item of items) {
    for (const club of item.clubs) {
      const existing = buckets.get(club.id);
      if (existing) {
        existing.items.push(item);
      } else {
        buckets.set(club.id, {
          clubId: club.id,
          clubSlug: club.slug,
          clubName: club.name,
          items: [item],
        });
      }
    }
  }
  return buckets;
}

/** Renders music media as a single trending strip when content is light, or
 *  splits into per-club strips when items span multiple clubs. Keeps the
 *  landing page compact regardless of how much content accumulates. */
export function MusicMediaSmartFeed({
  items,
  trendingLimit = 12,
  perClubLimit = 8,
  minClubsForGrouping = 2,
}: Props) {
  if (items.length === 0) return null;

  const buckets = bucketByClub(items);
  const clubsRepresented = buckets.size;
  const shouldGroup = clubsRepresented >= minClubsForGrouping;
  const trending = pickTrending(items, trendingLimit);

  if (!shouldGroup) {
    return (
      <MusicMediaTrendingRow
        items={trending}
        title="Fotos y videos"
        subtitle="Sesiones de fotos, prensa de época y performances."
      />
    );
  }

  // Multi-club: headline trending row + one row per club (top-N each), sorted
  // by club size desc so the most-active clubs surface first.
  const clubRows = Array.from(buckets.values())
    .map((b) => ({
      ...b,
      items: [...b.items]
        .sort((a, x) => (a.created_at < x.created_at ? 1 : -1))
        .slice(0, perClubLimit),
    }))
    .sort((a, b) => b.items.length - a.items.length);

  return (
    <div className="space-y-6">
      <MusicMediaTrendingRow
        items={trending}
        title="Tendencias · Fotos y videos"
        subtitle="Lo más reciente de todos los clubes."
      />
      {clubRows.map((row) => (
        <MusicMediaTrendingRow
          key={row.clubId}
          items={row.items}
          title={`De ${row.clubName}`}
          seeAllHref={`/musica/clubes/${row.clubSlug}/galeria` as Route}
        />
      ))}
    </div>
  );
}

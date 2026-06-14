import 'server-only';

/**
 * Server reads that back the music `/musica/clubes/**` views plus the album
 * detail genre chips. Every export is `cache()`-wrapped so the same render
 * doesn't double-query.
 *
 * This file is a barrel — the implementations live in cohesive per-domain
 * modules under `./clubs/`. Import specifiers across the app are unchanged
 * (`music-articles.server.ts` and the club pages/components keep importing
 * `fetchProfilesByUserIds`, `MusicClubRow`, `ClubJoinStatus`, and the
 * `list*`/`get*` reads from here).
 */

export * from './clubs/_shared.server';
export * from './clubs/metadata.server';
export * from './clubs/resources.server';
export * from './clubs/permissions.server';

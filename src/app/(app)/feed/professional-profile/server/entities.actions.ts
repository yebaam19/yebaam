/**
 * Barrel for the professional-profile child-entity Server Actions (titles,
 * studies, associations, licenses, skills, languages, experience). The actions
 * live in per-entity `'use server'` modules under `./entities/`; the shared
 * owner gate + generic mutators + credential-drift logic live in the
 * server-only `./entities/_helpers`.
 *
 * NOTE: this barrel intentionally does NOT re-export `requireOwner` — that is a
 * server-only helper, and re-exporting it here would pull `_helpers` (and its
 * `server-only` chain) into the client bundles of the `'use client'` section
 * components that import these actions. Server callers import it directly from
 * `./entities/_helpers` (see `credentials.actions.ts`).
 */

export * from './entities/titles.actions';
export * from './entities/studies.actions';
export * from './entities/associations.actions';
export * from './entities/licenses.actions';
export * from './entities/skills.actions';
export * from './entities/languages.actions';
export * from './entities/experience.actions';

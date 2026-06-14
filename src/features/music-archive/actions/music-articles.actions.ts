// Barrel for music-article actions. Behavior-preserving split — the original
// import surface is preserved so no consumer needs editing.
//
// Action sub-files are each their own 'use server' module; shared DTO types
// live in ./articles/types (no directive, since a 'use server' file may not
// export types). None of these re-exports are 'server-only', so this barrel
// is safe to import from 'use client' components.
export * from './articles/crud.actions';
export * from './articles/tags.actions';
export * from './articles/search.actions';
export * from './articles/types';

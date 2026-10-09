-- Reuse the existing versioned, audited section settings for Home curation.
alter table public.community_sections
  add column if not exists is_featured boolean not null default false;

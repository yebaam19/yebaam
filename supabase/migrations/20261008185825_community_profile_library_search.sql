alter table public.community_library_assets add column if not exists search_vector tsvector
  generated always as (to_tsvector('simple', title || ' ' || description)) stored;
create index if not exists community_library_assets_search_idx
  on public.community_library_assets using gin(search_vector) where deleted_at is null;
create index if not exists community_asset_folders_cursor_idx
  on public.community_asset_folders(community_id, kind, created_at desc, id desc);

-- Cloudflare ownership is verified on the server before a receipt is written.
-- Client-side PostgREST writes cannot attach an arbitrary image ID.
create table public.community_header_image_receipts (
  image_id text primary key check (image_id ~ '^[A-Za-z0-9_-]{20,64}$'),
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  verified_at timestamptz not null default now()
);
create index community_header_image_receipts_uploader_idx
  on public.community_header_image_receipts(uploaded_by);
alter table public.community_header_image_receipts enable row level security;
revoke all on public.community_header_image_receipts from anon,authenticated;
grant select,insert on public.community_header_image_receipts to service_role;
create policy community_header_image_receipts_private
  on public.community_header_image_receipts for all to authenticated
  using (false) with check (false);

create or replace function community_private.require_verified_header_images()
returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); check_cover boolean; check_profile boolean;
  candidate text;
begin
  if tg_op='INSERT' then
    check_cover:=new.cover_image is not null;
    check_profile:=new.profile_image is not null;
    if (check_cover or check_profile) and new.owner_id is distinct from actor then
      raise exception 'Image owner mismatch' using errcode='42501';
    end if;
  else
    check_cover:=new.cover_image is not null
      and new.cover_image is distinct from old.cover_image;
    check_profile:=new.profile_image is not null
      and new.profile_image is distinct from old.profile_image;
  end if;
  if not check_cover and not check_profile then return new; end if;
  if actor is null then raise exception 'Image owner missing' using errcode='42501'; end if;

  foreach candidate in array array[
    case when check_cover then new.cover_image end,
    case when check_profile then new.profile_image end
  ] loop
    if candidate is null then continue; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
      'community-remote:image:'||candidate,0));
    if not exists (select 1 from public.community_header_image_receipts r
      where r.image_id=candidate and r.uploaded_by=actor)
      or exists (select 1 from public.community_asset_deletions d
        where d.kind='image' and d.media_id=candidate) then
      raise exception 'Unverified community image' using errcode='42501';
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function community_private.require_verified_header_images()
  from public,anon,authenticated;
create trigger require_verified_header_images
  before insert or update of cover_image,profile_image on public.communities
  for each row execute function community_private.require_verified_header_images();

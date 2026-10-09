-- Framing remains reversible: preserve the Cloudflare original and store only its viewport.
alter table public.communities
  add column if not exists cover_framing jsonb not null default '{"x":50,"y":50,"zoom":1}',
  add column if not exists profile_framing jsonb not null default '{"x":50,"y":50,"zoom":1}',
  add column if not exists header_image_version integer not null default 1;

create or replace function community_private.valid_image_framing(value jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(value) = 'object'
    and value ?& array['x','y','zoom'] and value - array['x','y','zoom'] = '{}'::jsonb
    and jsonb_typeof(value->'x') = 'number' and jsonb_typeof(value->'y') = 'number'
    and jsonb_typeof(value->'zoom') = 'number'
    and (value->>'x')::numeric between 0 and 100
    and (value->>'y')::numeric between 0 and 100
    and (value->>'zoom')::numeric between 1 and 3, false);
$$;
revoke all on function community_private.valid_image_framing(jsonb) from public, anon;
grant execute on function community_private.valid_image_framing(jsonb) to authenticated, service_role;

alter table public.communities
  drop constraint if exists communities_cover_framing_valid,
  drop constraint if exists communities_profile_framing_valid,
  drop constraint if exists communities_header_image_version_positive;
alter table public.communities
  add constraint communities_cover_framing_valid check (community_private.valid_image_framing(cover_framing)),
  add constraint communities_profile_framing_valid check (community_private.valid_image_framing(profile_framing)),
  add constraint communities_header_image_version_positive check (header_image_version > 0);

create or replace function community_private.version_header_images()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.cover_image is null then new.cover_framing := '{"x":50,"y":50,"zoom":1}'; end if;
  if new.profile_image is null then new.profile_framing := '{"x":50,"y":50,"zoom":1}'; end if;
  if tg_op = 'INSERT' then new.header_image_version := 1;
  else
    new.header_image_version := old.header_image_version + case when
      (new.cover_image,new.profile_image,new.cover_framing,new.profile_framing)
      is distinct from (old.cover_image,old.profile_image,old.cover_framing,old.profile_framing)
      then 1 else 0 end;
  end if;
  return new;
end;
$$;
revoke all on function community_private.version_header_images() from public, anon, authenticated;
drop trigger if exists version_header_images on public.communities;
create trigger version_header_images before insert or update on public.communities
  for each row execute function community_private.version_header_images();

-- Audit only identity-image fields, not the rest of the community's settings.
-- Definer is needed solely to append the protected revision ledger after an RLS-authorized write.
create or replace function community_private.audit_header_images()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.header_image_version is distinct from old.header_image_version then
    insert into public.community_profile_revisions
      (community_id, entity_table, entity_id, operation, actor_id, before_data, after_data)
    values (new.id, 'community_header_images', new.id, 'UPDATE', auth.uid(),
      jsonb_build_object('cover_image',old.cover_image,'profile_image',old.profile_image,
        'cover_framing',old.cover_framing,'profile_framing',old.profile_framing,'version',old.header_image_version),
      jsonb_build_object('cover_image',new.cover_image,'profile_image',new.profile_image,
        'cover_framing',new.cover_framing,'profile_framing',new.profile_framing,'version',new.header_image_version));
  end if;
  return null;
end;
$$;
revoke all on function community_private.audit_header_images() from public, anon, authenticated;
drop trigger if exists audit_header_images on public.communities;
create trigger audit_header_images after update on public.communities
  for each row execute function community_private.audit_header_images();
-- Existing owner-only UPDATE RLS remains authoritative; no new table grants or exposed RPCs.

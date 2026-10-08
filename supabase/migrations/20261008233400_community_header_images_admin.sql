-- Header media is the only part of communities that delegated admins may update.
-- This service-only RPC follows a verified server action and rechecks the grant
-- under the same row lock as the write. It never accepts a delivery URL.
create or replace function public.save_community_header_image(
  p_community_id uuid,
  p_actor_id uuid,
  p_target text,
  p_image_id text,
  p_framing jsonb,
  p_expected_version integer
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  current_community public.communities%rowtype;
  effective_framing jsonb;
  saved_version integer;
begin
  if p_actor_id is null or p_target is null or p_target not in ('cover', 'profile')
    or p_expected_version is null or p_expected_version < 1 then
    raise exception 'Invalid header image request' using errcode = '23514';
  end if;
  if p_image_id is not null and p_image_id !~ '^[A-Za-z0-9_-]{20,64}$' then
    raise exception 'Invalid image identifier' using errcode = '23514';
  end if;
  effective_framing := case when p_image_id is null
    then '{"x":50,"y":50,"zoom":1}'::jsonb else p_framing end;
  if not community_private.valid_image_framing(effective_framing) then
    raise exception 'Invalid image framing' using errcode = '23514';
  end if;

  select * into current_community from public.communities
    where id = p_community_id for update;
  if not found then
    raise exception 'Community not found' using errcode = 'P0002';
  end if;
  if current_community.owner_id is distinct from p_actor_id and not exists (
    select 1 from public.community_profile_roles r
    join public.community_members m
      on m.community_id = r.community_id and m.user_id = r.user_id
    where r.community_id = p_community_id and r.user_id = p_actor_id
      and r.role = 'admin' and m.status = 'active'
  ) then
    raise exception 'Not allowed to edit community header' using errcode = '42501';
  end if;

  if (p_target = 'cover' and current_community.cover_image is not distinct from p_image_id
      and current_community.cover_framing = effective_framing)
    or (p_target = 'profile' and current_community.profile_image is not distinct from p_image_id
      and current_community.profile_framing = effective_framing) then
    return current_community.header_image_version;
  end if;
  if current_community.header_image_version <> p_expected_version then
    raise exception 'Header image version changed' using errcode = '40001';
  end if;

  -- The existing audit trigger reads auth.uid(); record the verified actor.
  perform pg_catalog.set_config('request.jwt.claim.sub', p_actor_id::text, true);
  if p_target = 'cover' then
    update public.communities set cover_image = p_image_id,
      cover_framing = effective_framing where id = p_community_id
      returning header_image_version into saved_version;
  else
    update public.communities set profile_image = p_image_id,
      profile_framing = effective_framing where id = p_community_id
      returning header_image_version into saved_version;
  end if;
  return saved_version;
end;
$$;
revoke all on function public.save_community_header_image(uuid,uuid,text,text,jsonb,integer)
  from public, anon, authenticated;
grant execute on function public.save_community_header_image(uuid,uuid,text,text,jsonb,integer)
  to service_role;

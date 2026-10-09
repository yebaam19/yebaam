-- Run as postgres in a transaction. The temporary tab edit is rolled back.
begin;
do $$
declare
  test_community uuid;
  owner_id uuid;
  other_id uuid;
  payload jsonb;
begin
  select c.id, c.owner_id into strict test_community, owner_id
  from public.communities c where c.slug = 'comunidad-mvp-test';
  select id into strict other_id from auth.users where id <> owner_id order by created_at limit 1;
  if not (select relrowsecurity from pg_class where oid = 'public.community_top_tabs'::regclass) then
    raise exception 'top tabs must use RLS';
  end if;
  if has_function_privilege('anon', 'public.save_community_top_tabs(uuid,jsonb)', 'EXECUTE') then
    raise exception 'anonymous users must not execute tab edits';
  end if;

  select jsonb_agg(jsonb_build_object(
    'tab_key', keys.tab_key, 'title', coalesce(saved.title, keys.tab_key),
    'position', keys.ordinality - 1, 'is_visible', keys.tab_key <> 'videos',
    'expected_version', coalesce(saved.version, 0)
  ) order by keys.ordinality) into payload
  from unnest(array['posts','photos','videos','articles','files','pdf'])
    with ordinality as keys(tab_key, ordinality)
  left join public.community_top_tabs saved
    on saved.community_id = test_community and saved.tab_key = keys.tab_key;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform public.save_community_top_tabs(test_community, payload);

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  if exists (select 1 from public.community_top_tabs
    where community_id = test_community and tab_key = 'videos') then
    raise exception 'hidden tab leaked to anonymous viewer';
  end if;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', other_id::text, true);
  begin
    perform public.save_community_top_tabs(test_community, '[]'::jsonb);
    raise exception 'non-owner edited community tabs';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  if not exists (select 1 from public.community_top_tabs
    where community_id = test_community and tab_key = 'videos') then
    raise exception 'settings manager cannot see hidden tab';
  end if;
  begin
    perform public.save_community_top_tabs(test_community, '[]'::jsonb);
    raise exception 'invalid tab payload was accepted';
  exception when check_violation then null;
  end;
end;
$$;
rollback;

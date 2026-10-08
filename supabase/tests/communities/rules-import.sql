begin;
do $$
declare
  users uuid[];
  community_uuid uuid := gen_random_uuid();
  section_uuid uuid;
  same_section uuid;
  original_rules jsonb := '[{"id":"rule-0","title":"Respeto","description":"Sin ataques personales","order":2},{"id":"rule-1","title":"Seguridad","description":"Sin phishing","order":1}]';
begin
  select array_agg(id) into users from (
    select p.id from public.profiles p join auth.users u on u.id = p.id order by p.id limit 2
  ) candidates;
  if cardinality(users) < 2 then raise exception 'Two existing profiles required'; end if;
  insert into public.communities(id, owner_id, name, slug, privacy, rules)
    values (community_uuid, users[1], 'Transactional rules test', 'test-rules-' || community_uuid, 'PUBLIC', original_rules);
  perform set_config('request.jwt.claim.sub', users[2]::text, true);
  set local role authenticated;
  begin
    perform public.import_community_plan_rules(community_uuid);
    raise exception 'Outsider imported rules';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', users[1]::text, true);
  section_uuid := public.import_community_plan_rules(community_uuid);
  same_section := public.import_community_plan_rules(community_uuid);
  if section_uuid <> same_section then raise exception 'Import not idempotent'; end if;
  if (select count(*) from public.community_plan_points where section_id = section_uuid) <> 2 then
    raise exception 'Import lost or duplicated rules';
  end if;
  if (select title from public.community_plan_points where section_id = section_uuid order by position limit 1) <> 'Seguridad' then
    raise exception 'Import order wrong';
  end if;
  if not exists (select 1 from public.community_profile_revisions where community_id = community_uuid
    and entity_table = 'communities_legacy_rules' and before_data->'rules' = original_rules) then
    raise exception 'Original rules not archived';
  end if;
  update public.community_sections set is_visible = false where id = section_uuid;
  perform set_config('request.jwt.claim.sub', users[2]::text, true);
  if not public.community_uses_structured_rules(community_uuid) then
    raise exception 'Hidden rules would trigger legacy fallback';
  end if;
  if exists (select 1 from public.community_plan_points where section_id = section_uuid)
    or exists (select 1 from public.community_profile_revisions where community_id = community_uuid) then
    raise exception 'Hidden rules or archive leaked';
  end if;
  if (select rules from public.communities where id = community_uuid) <> '[]'::jsonb then
    raise exception 'Legacy copy leaked from public row';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  if not public.community_uses_structured_rules(community_uuid) then raise exception 'Anonymous marker mismatch'; end if;
  if exists (select 1 from public.community_plan_points where section_id = section_uuid) then
    raise exception 'Anonymous read of hidden points';
  end if;
  reset role;
end;
$$;
rollback;
select 'PASS: import authorization, ordering, idempotency, private backup and hidden-section fallback' as result;

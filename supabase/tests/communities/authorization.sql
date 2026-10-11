-- Run via Supabase MCP execute_sql. Every fixture is rolled back.
begin;
do $$
declare
  users uuid[];
  owner_id uuid;
  editor_id uuid;
  outsider_id uuid;
  community_a uuid := gen_random_uuid();
  community_b uuid := gen_random_uuid();
  section_a uuid := gen_random_uuid();
  section_b uuid := gen_random_uuid();
  axis_a uuid := gen_random_uuid();
  axis_b uuid := gen_random_uuid();
  point_a uuid := gen_random_uuid();
  point_b uuid := gen_random_uuid();
  row_version integer;
  affected integer;
begin
  select array_agg(id) into users from (
    select p.id from public.profiles p join auth.users u on u.id = p.id order by p.id limit 3
  ) candidates;
  if cardinality(users) < 3 then raise exception 'Test needs three existing profiles'; end if;
  owner_id := users[1]; editor_id := users[2]; outsider_id := users[3];
  insert into public.communities(id, owner_id, name, slug, privacy) values
    (community_a, owner_id, 'Transactional test A', 'plan-test-' || community_a, 'PUBLIC'),
    (community_b, outsider_id, 'Transactional test B', 'plan-test-' || community_b, 'PRIVATE');
  insert into public.community_members(community_id, user_id, role, status)
    values (community_a, editor_id, 'MEMBER', 'active');

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  insert into public.community_sections(id, community_id, kind, title) values
    (section_a, community_a, 'government', 'Plan');
  insert into public.community_plan_axes(id, community_id, section_id, title) values
    (axis_a, community_a, section_a, 'Trabajo'), (axis_b, community_a, section_a, 'Salud');
  insert into public.community_plan_points(id, community_id, section_id, axis_id, title) values
    (point_a, community_a, section_a, axis_a, 'Empleo'),
    (point_b, community_a, section_a, axis_a, 'Formación');
  if (select position from public.community_plan_axes where id = axis_b) <> 1
    or (select position from public.community_plan_points where id = point_b) <> 1 then
    raise exception 'New items did not append';
  end if;
  if (select count(*) from public.community_profile_revisions where community_id = community_a) <> 5 then
    raise exception 'Creation history missing';
  end if;
  if exists (select 1 from public.community_plan_points where community_id = community_a and is_published) then
    raise exception 'New content must default to draft';
  end if;
  perform public.move_community_plan_item(community_a, section_a, 'point', point_b, 1, axis_a, point_a);
  if (select position from public.community_plan_points where id = point_b) <> 0 then
    raise exception 'Reordering before another point failed';
  end if;

  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  if exists (select 1 from public.community_sections where id = section_a)
    or exists (select 1 from public.community_plan_points where id = point_a) then
    raise exception 'Draft leaked to outsider';
  end if;
  update public.community_plan_points set title = 'Unauthorized' where id = point_a;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Outsider modified another organization'; end if;
  delete from public.community_plan_points where id = point_a;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Outsider deleted another organization content'; end if;
  begin
    insert into public.community_members(community_id, user_id, role, status)
      values (community_a, outsider_id, 'ADMIN', 'active');
    raise exception 'Self promotion to legacy admin allowed';
  exception when insufficient_privilege then null;
  end;
  if community_private.can_manage_profile(community_a, 'plans') then
    raise exception 'Untrusted legacy membership granted institutional permissions';
  end if;
  begin
    insert into public.community_profile_roles(community_id, user_id, role)
      values (community_a, outsider_id, 'admin');
    raise exception 'Self promotion allowed';
  exception when insufficient_privilege then null;
  when raise_exception then
    if sqlerrm <> 'Institutional roles require active membership' then raise; end if;
  end;
  insert into public.community_sections(id, community_id, kind, title, is_visible)
    values (section_b, community_b, 'government', 'Private plan', true);

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  begin
    insert into public.community_plan_axes(community_id, section_id, title)
      values (community_a, section_b, 'Cross tenant');
    raise exception 'Cross tenant parent accepted';
  exception when check_violation or foreign_key_violation then null;
  end;
  update public.community_sections set is_visible = true where id = section_a;
  update public.community_plan_axes set is_published = true where id = axis_a;
  update public.community_plan_points set is_published = true where id = point_a;

  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  if (select count(*) from public.community_plan_points where community_id = community_a) <> 1 then
    raise exception 'Published visibility mismatch';
  end if;
  if exists (select 1 from public.community_sections where id = section_b) then
    raise exception 'Private organization leaked';
  end if;
  begin
    insert into public.community_plan_axes(community_id, section_id, title)
      values (community_a, section_a, 'Anonymous');
    raise exception 'Anonymous write allowed';
  exception when insufficient_privilege then null;
  end;
  reset role;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  update public.community_sections set is_visible = false where id = section_a;
  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  if exists (select 1 from public.community_plan_points where id = point_a) then
    raise exception 'Hiding section failed to hide child';
  end if;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  insert into public.community_profile_roles(community_id, user_id, role)
    values (community_a, editor_id, 'editor');
  perform set_config('request.jwt.claim.sub', editor_id::text, true);
  if community_private.can_manage_profile(community_a, 'plans') then
    raise exception 'Editor received plans access without grant';
  end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  update public.community_profile_roles set can_edit_plans = true
    where community_id = community_a and user_id = editor_id;
  perform set_config('request.jwt.claim.sub', editor_id::text, true);
  update public.community_plan_points set title = 'Edited' where id = point_a returning version into row_version;
  if row_version <> 4 then raise exception 'Editor update/version failed'; end if;
  update public.community_plan_points set title = 'Stale' where id = point_a and version = 1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale version overwrote content'; end if;
  perform public.move_community_plan_item(community_a, section_a, 'point', point_a, row_version, axis_b, null);
  if not exists (select 1 from public.community_plan_points where id = point_a and axis_id = axis_b) then
    raise exception 'Move between axes failed';
  end if;
  begin
    perform public.move_community_plan_item(community_a, section_b, 'point', point_b, 1, axis_b, null);
    raise exception 'Cross section move allowed';
  exception when serialization_failure then null;
  end;
  begin
    update public.community_profile_revisions set operation = 'DELETE' where community_id = community_a;
    raise exception 'Audit history is mutable';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  update public.community_profile_roles set role = 'moderator'
    where community_id = community_a and user_id = editor_id;
  perform set_config('request.jwt.claim.sub', editor_id::text, true);
  if community_private.can_manage_profile(community_a, 'plans') then
    raise exception 'Moderator can edit plans';
  end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  update public.community_profile_roles set role = 'admin'
    where community_id = community_a and user_id = editor_id;
  perform set_config('request.jwt.claim.sub', editor_id::text, true);
  if not community_private.can_manage_profile(community_a, 'settings') then
    raise exception 'Admin lacks profile management';
  end if;
  reset role;
  update public.community_members set status = 'banned'
    where community_id = community_a and user_id = editor_id;
  set local role authenticated;
  if community_private.can_manage_profile(community_a, 'plans') then
    raise exception 'Banned admin retains edit access';
  end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  delete from public.community_plan_axes where id = axis_b;
  if exists (select 1 from public.community_plan_points where id = point_a) then
    raise exception 'Axis deletion left orphan points';
  end if;
  if not exists (select 1 from public.community_profile_revisions
    where entity_id = point_a and operation = 'DELETE') then
    raise exception 'Deletion history missing';
  end if;
  reset role;
end;
$$;
rollback;
select 'PASS: drafts, public/private reads, tenant isolation, roles, versions, moves and immutable history' as result;

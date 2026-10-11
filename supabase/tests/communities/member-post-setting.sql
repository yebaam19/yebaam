-- Run through Supabase MCP execute_sql; all fixtures are rolled back.
begin;
do $$
declare
  people uuid[];
  owner_id uuid;
  member_id uuid;
  outsider_id uuid;
  org_id uuid := gen_random_uuid();
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id = u.id
    order by u.id limit 3
  ) candidates;
  if cardinality(people) < 3 then raise exception 'Three profiles required'; end if;
  owner_id := people[1]; member_id := people[2]; outsider_id := people[3];
  insert into public.communities(id, owner_id, name, slug, privacy, allow_member_posts)
    values (org_id, owner_id, 'Member post setting QA', 'post-setting-' || org_id, 'SECRET', false);
  insert into public.community_members(community_id, user_id, role, status)
    values (org_id, member_id, 'MEMBER', 'active');

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  insert into public.community_posts(community_id, author_id, body)
    values (org_id, owner_id, 'Owner can publish when member posts are off');

  perform set_config('request.jwt.claim.sub', member_id::text, true);
  begin
    insert into public.community_posts(community_id, author_id, body)
      values (org_id, member_id, 'Member cannot bypass disabled posts');
    raise exception 'Member bypassed disabled posts';
  exception when insufficient_privilege then null; end;

  reset role;
  update public.communities set allow_member_posts = true where id = org_id;
  set local role authenticated;
  insert into public.community_posts(community_id, author_id, body)
    values (org_id, member_id, 'Member can publish when enabled');

  reset role;
  update public.community_members set status = 'banned'
    where community_id = org_id and user_id = member_id;
  set local role authenticated;
  begin
    insert into public.community_posts(community_id, author_id, body)
      values (org_id, member_id, 'Banned member cannot publish');
    raise exception 'Banned member published';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  begin
    insert into public.community_posts(community_id, author_id, body)
      values (org_id, outsider_id, 'Outsider cannot publish');
    raise exception 'Outsider published';
  exception when insufficient_privilege then null; end;

  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  begin
    insert into public.community_posts(community_id, author_id, body)
      values (org_id, owner_id, 'Anonymous cannot publish');
    raise exception 'Anonymous user published';
  exception when insufficient_privilege then null; end;
  reset role;
end;
$$;
rollback;
select 'PASS: owner, enabled member, disabled member, banned, outsider and anonymous posting' as result;

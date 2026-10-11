-- Run through Supabase MCP execute_sql; the synthetic community is rolled back.
begin;
do $$
declare
  people uuid[];
  owner_id uuid;
  moderator_id uuid;
  member_id uuid;
  outsider_id uuid;
  org_id uuid := gen_random_uuid();
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id = u.id
    order by u.id limit 4
  ) candidates;
  if cardinality(people) < 4 then raise exception 'Four profiles required'; end if;
  owner_id := people[1]; moderator_id := people[2];
  member_id := people[3]; outsider_id := people[4];
  insert into public.communities(id, owner_id, name, slug, privacy)
    values (org_id, owner_id, 'Private roster QA', 'roster-qa-' || org_id, 'PUBLIC');
  insert into public.community_members(community_id, user_id, role, status) values
    (org_id, moderator_id, 'MEMBER', 'active'),
    (org_id, member_id, 'MEMBER', 'active');
  insert into public.community_profile_roles(community_id, user_id, role)
    values (org_id, moderator_id, 'moderator');

  set local role anon;
  if exists(select 1 from public.community_members where community_id = org_id) then
    raise exception 'Anonymous visitor read the roster';
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  set local role authenticated;
  if exists(select 1 from public.community_members where community_id = org_id) then
    raise exception 'Outsider read the roster';
  end if;

  perform set_config('request.jwt.claim.sub', member_id::text, true);
  if (select count(*) from public.community_members where community_id = org_id) <> 1
    or not exists(select 1 from public.community_members
      where community_id = org_id and user_id = member_id) then
    raise exception 'Ordinary member must only read own membership';
  end if;

  perform set_config('request.jwt.claim.sub', moderator_id::text, true);
  if not exists(select 1 from public.community_members
    where community_id = org_id and user_id = member_id) then
    raise exception 'Moderator cannot inspect member roster';
  end if;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  if not exists(select 1 from public.community_members
    where community_id = org_id and user_id = member_id) then
    raise exception 'Owner cannot inspect member roster';
  end if;
  reset role;
end;
$$;
rollback;
select 'PASS: public community roster private to staff; members see only themselves' as result;

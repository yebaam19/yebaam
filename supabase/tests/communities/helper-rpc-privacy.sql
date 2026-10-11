-- Execute with Supabase MCP execute_sql; fixtures are rolled back.
begin;
do $$
declare
  users uuid[];
  owner_id uuid;
  member_id uuid;
  outsider_id uuid;
  private_id uuid := gen_random_uuid();
  public_id uuid := gen_random_uuid();
begin
  select array_agg(id) into users from (
    select p.id from public.profiles p join auth.users u on u.id = p.id
    order by p.id limit 3
  ) candidates;
  if cardinality(users) < 3 then raise exception 'Test needs three profiles'; end if;
  owner_id := users[1]; member_id := users[2]; outsider_id := users[3];

  insert into public.communities(id, owner_id, name, slug, privacy) values
    (private_id, owner_id, 'Helper private test', 'helper-private-' || private_id, 'PRIVATE'),
    (public_id, owner_id, 'Helper public test', 'helper-public-' || public_id, 'PUBLIC');
  insert into public.community_members(community_id, user_id, role, status)
    values (private_id, member_id, 'ADMIN', 'active');
  insert into public.community_invitations(community_id, invitee_id, invited_by)
    values (private_id, member_id, owner_id);

  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  if public.has_pending_community_invite(private_id, member_id)
    or public.is_community_admin(private_id, member_id)
    or public.is_community_member(private_id, member_id)
    or public.is_community_visible(private_id, member_id)
    or not public.is_community_visible(public_id, null)
    or exists(select 1 from public.communities where id = private_id)
    or not exists(select 1 from public.communities where id = public_id) then
    raise exception 'Anonymous caller leaked private state or lost public access';
  end if;

  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  set local role authenticated;
  if public.has_pending_community_invite(private_id, member_id)
    or public.is_community_admin(private_id, member_id)
    or public.is_community_member(private_id, member_id)
    or public.is_community_visible(private_id, member_id)
    or public.is_community_visible(private_id, outsider_id) then
    raise exception 'Authenticated caller inspected someone else';
  end if;

  perform set_config('request.jwt.claim.sub', member_id::text, true);
  if not public.has_pending_community_invite(private_id, member_id)
    or not public.is_community_admin(private_id, member_id)
    or not public.is_community_member(private_id, member_id)
    or not public.is_community_visible(private_id, member_id)
    or not exists(select 1 from public.communities where id = private_id) then
    raise exception 'Member lost access to own private community';
  end if;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  if not public.is_community_admin(private_id, owner_id)
    or not public.is_community_visible(private_id, owner_id) then
    raise exception 'Owner lost access';
  end if;
  reset role;
end;
$$;
rollback;
select 'PASS: community helpers bind private answers to the caller' as result;

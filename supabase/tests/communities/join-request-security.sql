-- Execute with Supabase MCP execute_sql; fixtures and mutations roll back.
begin;
do $$
declare
  users uuid[];
  owner_id uuid;
  requester_id uuid;
  outsider_id uuid;
  private_id uuid := gen_random_uuid();
  public_id uuid := gen_random_uuid();
  request_id uuid;
  another_request uuid;
begin
  select array_agg(id) into users from (
    select p.id from public.profiles p join auth.users u on u.id = p.id
    order by p.id limit 3
  ) candidates;
  if cardinality(users) < 3 then raise exception 'Test needs three profiles'; end if;
  owner_id := users[1]; requester_id := users[2]; outsider_id := users[3];
  insert into public.communities(id, owner_id, name, slug, privacy) values
    (private_id, owner_id, 'Request security private', 'request-private-' || private_id, 'PRIVATE'),
    (public_id, owner_id, 'Request security public', 'request-public-' || public_id, 'PUBLIC');

  perform set_config('request.jwt.claim.sub', requester_id::text, true);
  set local role authenticated;
  begin
    insert into public.community_join_requests(community_id, user_id, status)
      values (private_id, requester_id, 'approved');
    raise exception 'Requester inserted approved request';
  exception when insufficient_privilege then null;
  end;
  insert into public.community_join_requests(community_id, user_id)
    values (private_id, requester_id) returning id into request_id;
  begin
    insert into public.community_join_requests(community_id, user_id)
      values (private_id, requester_id);
    raise exception 'Duplicate pending request allowed';
  exception when unique_violation then null;
  end;
  begin
    update public.community_join_requests set status = 'approved' where id = request_id;
    raise exception 'Requester directly approved request';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.community_members(community_id, user_id, role, status)
      values (private_id, requester_id, 'MEMBER', 'active');
    raise exception 'Requester joined private community without approval';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.community_members(community_id, user_id, role, status)
      values (public_id, requester_id, 'ADMIN', 'active');
    raise exception 'Requester chose admin role';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.change_community_join_request(request_id, 'approved');
    raise exception 'Requester approved own request';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  begin
    perform public.change_community_join_request(request_id, 'cancelled');
    raise exception 'Outsider cancelled another request';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  if public.change_community_join_request(request_id, 'approved') <> private_id then
    raise exception 'Owner approval returned wrong community';
  end if;
  if not exists (select 1 from public.community_join_requests
      where id = request_id and status = 'approved' and responded_by = owner_id)
    or not exists (select 1 from public.community_members
      where community_id = private_id and user_id = requester_id
        and role = 'MEMBER' and status = 'active') then
    raise exception 'Approval and membership did not commit together';
  end if;

  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  insert into public.community_join_requests(community_id, user_id)
    values (private_id, outsider_id) returning id into another_request;
  perform public.change_community_join_request(another_request, 'cancelled');
  if not exists (select 1 from public.community_join_requests
      where id = another_request and status = 'cancelled') then
    raise exception 'Own cancellation failed';
  end if;
  insert into public.community_join_requests(community_id, user_id)
    values (private_id, outsider_id) returning id into another_request;
  perform public.change_community_join_request(another_request, 'cancelled');
  if (select count(*) from public.community_join_requests
      where community_id = private_id and user_id = outsider_id and status = 'cancelled') <> 2 then
    raise exception 'Repeated cancellation lost request history';
  end if;

  reset role;
  insert into public.community_members(community_id, user_id, role, status)
    values (private_id, outsider_id, 'MEMBER', 'banned');
  set local role authenticated;
  insert into public.community_join_requests(community_id, user_id)
    values (private_id, outsider_id) returning id into another_request;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  begin
    perform public.change_community_join_request(another_request, 'approved');
    raise exception 'Banned membership was approved';
  exception when check_violation then null;
  end;
  if not exists (select 1 from public.community_join_requests
      where id = another_request and status = 'pending') then
    raise exception 'Failed approval changed request status';
  end if;
  perform public.change_community_join_request(another_request, 'declined');
  if not exists (select 1 from public.community_join_requests
      where id = another_request and status = 'declined' and responded_by = owner_id) then
    raise exception 'Owner decline failed';
  end if;
  reset role;
end;
$$;
rollback;
select 'PASS: private requests, roles, atomic review, repeat requests and banned members' as result;

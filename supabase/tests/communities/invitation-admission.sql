-- Run through Supabase MCP execute_sql. All fixtures roll back.
begin;
do $$
declare
  users uuid[];
  owner_id uuid;
  invitee_id uuid;
  outsider_id uuid;
  moderator_id uuid;
  secret_id uuid := gen_random_uuid();
  other_secret_id uuid := gen_random_uuid();
  private_id uuid := gen_random_uuid();
  public_id uuid := gen_random_uuid();
  invite_id uuid;
begin
  select array_agg(id) into users from (
    select p.id from public.profiles p join auth.users u on u.id = p.id
    order by p.id limit 4
  ) candidates;
  if cardinality(users) < 4 then raise exception 'Test needs four profiles'; end if;
  owner_id := users[1]; invitee_id := users[2];
  outsider_id := users[3]; moderator_id := users[4];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (secret_id,owner_id,'Admission secret','admission-secret-' || secret_id,'SECRET'),
    (other_secret_id,owner_id,'Admission other','admission-other-' || other_secret_id,'SECRET'),
    (private_id,owner_id,'Admission private','admission-private-' || private_id,'PRIVATE'),
    (public_id,owner_id,'Admission public','admission-public-' || public_id,'PUBLIC');

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  insert into public.community_invitations(community_id,invitee_id,invited_by)
    values(secret_id,invitee_id,owner_id) returning id into invite_id;
  perform set_config('request.jwt.claim.sub', invitee_id::text, true);
  if exists (select 1 from public.communities where id = secret_id) then
    raise exception 'Secret profile was visible before acceptance';
  end if;
  begin
    update public.community_invitations set community_id = other_secret_id
      where id = invite_id;
    raise exception 'Invitee moved invitation to another community';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.community_members(community_id,user_id,role,status)
      values(secret_id,invitee_id,'MEMBER','active');
    raise exception 'Invitee bypassed atomic acceptance';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.accept_community_invitation(other_secret_id);
    raise exception 'Invitee joined unrelated secret community';
  exception when insufficient_privilege then null;
  end;
  if public.accept_community_invitation(secret_id) <> secret_id then
    raise exception 'Acceptance returned wrong community';
  end if;
  if not exists (select 1 from public.community_members
      where community_id = secret_id and user_id = invitee_id
        and role = 'MEMBER' and status = 'active')
    or not exists (select 1 from public.communities where id = secret_id)
    or not exists (select 1 from public.community_invitations
      where id = invite_id and status = 'accepted' and responded_at is not null) then
    raise exception 'Acceptance did not commit membership and invitation together';
  end if;
  begin
    perform public.accept_community_invitation(secret_id);
    raise exception 'Invitation was consumed twice';
  exception when insufficient_privilege then null;
  end;

  reset role;
  insert into public.community_join_requests(community_id,user_id,status)
    values(private_id,invitee_id,'approved');
  insert into public.community_members(community_id,user_id,role,status)
    values(secret_id,moderator_id,'MODERATOR','active');
  perform set_config('request.jwt.claim.sub', invitee_id::text, true);
  set local role authenticated;
  begin
    insert into public.community_members(community_id,user_id,role,status)
      values(other_secret_id,invitee_id,'MEMBER','active');
    raise exception 'Approved request admitted user to unrelated secret community';
  exception when insufficient_privilege then null;
  end;
  insert into public.community_members(community_id,user_id,role,status)
    values(public_id,invitee_id,'MEMBER','active');

  perform set_config('request.jwt.claim.sub', moderator_id::text, true);
  begin
    insert into public.community_invitations(community_id,invitee_id,invited_by)
      values(secret_id,outsider_id,moderator_id);
    raise exception 'Moderator issued an invitation';
  exception when insufficient_privilege then null;
  end;
  reset role;
  insert into public.community_invitations(community_id,invitee_id,invited_by)
    values(other_secret_id,outsider_id,owner_id);
  insert into public.community_members(community_id,user_id,role,status)
    values(other_secret_id,outsider_id,'MEMBER','banned');
  perform set_config('request.jwt.claim.sub', outsider_id::text, true);
  set local role authenticated;
  begin
    perform public.accept_community_invitation(other_secret_id);
    raise exception 'Banned member accepted invitation';
  exception when check_violation then null;
  end;
  reset role;
  if not exists (select 1 from public.community_invitations i
      where i.community_id = other_secret_id and i.invitee_id = outsider_id
        and i.status = 'pending')
    or not exists (select 1 from public.community_members
      where community_id = other_secret_id and user_id = outsider_id
        and status = 'banned') then
    raise exception 'Failed acceptance changed invitation or ban';
  end if;
end;
$$;
rollback;
select 'PASS: invitation scope, atomic acceptance, roles and public admission' as result;

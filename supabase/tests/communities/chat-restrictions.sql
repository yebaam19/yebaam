-- Execute with Supabase MCP. All fixtures and role changes roll back.
begin;
do $$
declare
  people uuid[]; owner_id uuid; moderator_id uuid; member_id uuid; outsider_id uuid;
  org uuid:=gen_random_uuid(); private_org uuid:=gen_random_uuid();
  room uuid:=gen_random_uuid(); private_room uuid:=gen_random_uuid();
begin
  if has_function_privilege('authenticated',
    'public.set_community_chat_restriction(uuid,uuid,text,integer,text)',
    'EXECUTE') then
    raise exception 'Legacy non-idempotent restriction RPC is public';
  end if;
  if not has_function_privilege('authenticated',
    'public.set_community_chat_restriction(uuid,uuid,text,integer,text,uuid)',
    'EXECUTE') then
    raise exception 'Idempotent restriction RPC is unavailable';
  end if;
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id
    order by u.id limit 4
  ) candidates;
  if cardinality(people)<4 then raise exception 'Four profiles required'; end if;
  owner_id:=people[1]; moderator_id:=people[2];
  member_id:=people[3]; outsider_id:=people[4];
  insert into public.communities(id,owner_id,name,slug,privacy) values
    (org,owner_id,'Chat restriction test','chat-limit-'||org,'PUBLIC'),
    (private_org,owner_id,'Private chat test','chat-private-'||private_org,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,moderator_id,'MEMBER','active'),
    (org,member_id,'MEMBER','active'),
    (private_org,member_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role)
    values(org,moderator_id,'moderator');
  insert into public.public_chat_topics(id,slug,name,owner_type,owner_id,is_archived,is_permanent)
    values(room,'chat-limit-'||room,'Public room','community',org,false,true),
      (private_room,'chat-private-'||private_room,'Private room','community',private_org,false,true);

  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  begin
    insert into public.public_chat_messages(sender_id,topic_id,content)
      values(outsider_id,private_room,'Unauthorized direct write');
    raise exception 'Non-member wrote in private chat';
  exception when insufficient_privilege then null; end;
  reset role;

  update public.community_members set status='banned'
    where community_id=private_org and user_id=member_id;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  begin
    insert into public.public_chat_messages(sender_id,topic_id,content)
      values(member_id,private_room,'Banned direct write');
    raise exception 'Banned member wrote in private chat';
  exception when insufficient_privilege then null; end;
  reset role;
  update public.community_members set status='active'
    where community_id=private_org and user_id=member_id;

  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  begin
    perform public.set_community_chat_restriction(org,member_id,'suspend',24,
      'Unauthorized attempt to suspend another member',gen_random_uuid());
    raise exception 'Outsider moderated chat';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  perform public.set_community_chat_restriction(org,member_id,'suspend',24,
    'Repeated disruptive messages in the community chat',gen_random_uuid());
  if not exists(select 1 from public.community_chat_restrictions
    where community_id=org and user_id=member_id and kind='suspend' and revoked_at is null) then
    raise exception 'Moderator suspension missing';
  end if;
  begin
    perform public.set_community_chat_restriction(org,member_id,'block',null,
      'Attempt to make permanent block',gen_random_uuid());
    raise exception 'Moderator made permanent block';
  exception when check_violation then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_chat_restrictions
    where community_id=org and user_id=member_id and kind='suspend') then
    raise exception 'Suspended user cannot see decision';
  end if;
  if exists(select 1 from public.community_chat_restriction_audit
    where community_id=org) then
    raise exception 'Affected member can read staff audit';
  end if;
  begin
    update public.community_chat_restrictions set revoked_at=now()
      where community_id=org and user_id=member_id;
    raise exception 'Affected member changed own restriction';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.public_chat_messages(sender_id,topic_id,content)
      values(member_id,room,'Suspended direct write');
    raise exception 'Suspended member wrote in community chat';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  perform public.release_community_chat_restriction(org,member_id,
    'Suspension reviewed and lifted after appeal');
  reset role;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  insert into public.public_chat_messages(sender_id,topic_id,content)
    values(member_id,room,'Allowed after release');
  reset role;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  perform public.set_community_chat_restriction(org,member_id,'block',null,
    'Repeated serious violations after prior suspension',gen_random_uuid());
  reset role;
  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  begin
    perform public.set_community_chat_restriction(org,member_id,'suspend',1,
      'Attempt to replace an administrative block',gen_random_uuid());
    raise exception 'Moderator replaced administrative block';
  exception when insufficient_privilege then null; end;
  begin
    perform public.release_community_chat_restriction(org,member_id,
      'Attempt to release an administrative block');
    raise exception 'Moderator released administrative block';
  exception when no_data_found then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  perform public.release_community_chat_restriction(org,member_id,
    'Administrative review completed and block lifted');
  reset role;
  insert into public.platform_admins(user_id) values(outsider_id) on conflict do nothing;
  set local role authenticated;
  begin
    perform public.set_community_chat_restriction(org,outsider_id,'block',null,
      'Attempt to prevent platform oversight of this chat',gen_random_uuid());
    raise exception 'Community blocked a platform administrator';
  exception when insufficient_privilege then null; end;
  reset role;
  if (select count(*) from public.community_chat_restriction_audit
    where community_id=org and user_id=member_id)<>4 then
    raise exception 'Restriction audit did not capture two decisions and releases';
  end if;
  if exists(select 1 from public.community_chat_restriction_audit
    where community_id=org and ((before_data ? 'decided_by')
      or (after_data ? 'decided_by') or (after_data ? 'revoked_by'))) then
    raise exception 'Actor identifier leaked into audit snapshot';
  end if;
end;
$$;
rollback;

-- Run through Supabase MCP execute_sql; every fixture rolls back.
begin;
do $$
declare people uuid[]; owner_id uuid; moderator_id uuid; member_id uuid;
  outsider_id uuid; org uuid:=gen_random_uuid(); first_case uuid:=gen_random_uuid();
  second_case uuid:=gen_random_uuid(); claimed jsonb; lease uuid;
  reason text:='Repeated disruption observed in the community chat.';
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id
    where u.email is not null and u.email like '%@%'
    order by u.id limit 4
  ) candidates;
  if cardinality(people)<4 then raise exception 'Four email profiles required'; end if;
  owner_id:=people[1]; moderator_id:=people[2];
  member_id:=people[3]; outsider_id:=people[4];
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Resolution test','chat-resolution-'||org,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,moderator_id,'MEMBER','active'),(org,member_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role)
    values(org,moderator_id,'moderator');

  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  perform public.open_community_chat_case(first_case,org,member_id,'suspend',24,reason);
  begin
    perform public.resolve_community_chat_case(first_case,'warn',reason);
    raise exception 'The opener reviewed their own case';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  begin
    perform public.resolve_community_chat_case(first_case,'warn',reason);
    raise exception 'Resolution before mail delivery was allowed';
  exception when insufficient_privilege then null; end;
  reset role;

  set local role service_role;
  claimed:=public.claim_community_chat_case_mail(3);
  lease:=(claimed->0->>'lease_token')::uuid;
  if not public.finish_community_chat_case_mail(first_case,lease,true,null) then
    raise exception 'Could not deliver first case';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  begin
    perform public.resolve_community_chat_case(first_case,'warn',reason);
    raise exception 'The 48-hour defense window was skipped';
  exception when insufficient_privilege then null; end;
  reset role;

  set local role service_role;
  update public.community_chat_cases set
    notified_at=now()-interval '49 hours',defense_deadline=now()-interval '1 hour'
    where id=first_case;
  reset role;

  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  begin
    perform public.resolve_community_chat_case(first_case,'warn',reason);
    raise exception 'Outsider reviewed a private case';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  begin
    perform public.resolve_community_chat_case(first_case,'restrict',reason);
    raise exception 'First case skipped the warning ladder';
  exception when check_violation then null; end;
  perform public.resolve_community_chat_case(first_case,'warn',reason);
  perform public.resolve_community_chat_case(first_case,'warn',reason);
  reset role;
  if (select count(*) from public.notifications where
    type='community_chat_case_resolution' and related_id=first_case)<>1
    or exists(select 1 from public.community_chat_restrictions
      where community_id=org and user_id=member_id) then
    raise exception 'Warning duplicated notice or restricted the member';
  end if;

  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  perform public.open_community_chat_case(second_case,org,member_id,'suspend',24,reason);
  reset role;
  set local role service_role;
  -- now() is fixed for this rollback transaction; real case openings use
  -- separate requests and therefore a later transaction timestamp.
  update public.community_chat_cases set created_at=clock_timestamp()
    where id=second_case;
  claimed:=public.claim_community_chat_case_mail(3);
  lease:=(claimed->0->>'lease_token')::uuid;
  if not public.finish_community_chat_case_mail(second_case,lease,true,null) then
    raise exception 'Could not deliver second case';
  end if;
  update public.community_chat_cases set
    notified_at=now()-interval '49 hours',defense_deadline=now()-interval '1 hour'
    where id=second_case;
  reset role;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  perform public.resolve_community_chat_case(second_case,'restrict',reason);
  reset role;
  if not exists(select 1 from public.community_chat_restrictions
      where community_id=org and user_id=member_id and kind='suspend'
        and revoked_at is null and expires_at>now())
    or (select count(*) from public.notifications where
      type='community_chat_case_resolution' and related_id=second_case)<>1 then
    raise exception 'A reviewed repeated violation was not restricted';
  end if;
  if community_private.chat_case_decision_deadline(
      '2026-10-09 12:00:00+00'::timestamptz)
      <>'2026-10-16 12:00:00+00'::timestamptz then
    raise exception 'Business-day deadline did not skip the weekend';
  end if;
end;
$$;
rollback;

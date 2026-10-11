-- Run with Supabase MCP execute_sql. All fixtures and notices roll back.
begin;
do $$
declare people uuid[]; owner_id uuid; moderator_id uuid;
  member_id uuid; outsider_id uuid; org uuid:=gen_random_uuid();
  case_key uuid:=gen_random_uuid(); other_key uuid:=gen_random_uuid();
  explanation text:='I can explain the context of those chat messages.';
  claimed jsonb; lease uuid;
begin
  if has_table_privilege('authenticated','public.community_chat_cases','INSERT')
    or has_table_privilege('authenticated','public.community_chat_cases','UPDATE')
    or has_table_privilege('authenticated','public.community_chat_cases','DELETE')
    or has_table_privilege('authenticated','community_private.community_chat_case_mail','SELECT') then
    raise exception 'Case or mail grants are too broad';
  end if;
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id
    where u.email is not null and u.email like '%@%'
    order by u.id limit 4
  ) candidates;
  if cardinality(people)<4 then raise exception 'Four email profiles required'; end if;
  owner_id:=people[1]; moderator_id:=people[2];
  member_id:=people[3]; outsider_id:=people[4];
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Predecision test','chat-case-'||org,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,moderator_id,'MEMBER','active'),(org,member_id,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role)
    values(org,moderator_id,'moderator');

  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  begin
    perform public.open_community_chat_case(case_key,org,member_id,'suspend',24,
      'Repeated disruption in the community chat.');
    raise exception 'Outsider opened a case';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  if public.open_community_chat_case(case_key,org,member_id,'suspend',24,
    'Repeated disruption in the community chat.')<>case_key then
    raise exception 'Opening did not return the stable key';
  end if;
  if public.open_community_chat_case(case_key,org,member_id,'suspend',24,
    'Repeated disruption in the community chat.')<>case_key then
    raise exception 'Identical retry was not idempotent';
  end if;
  begin
    perform public.open_community_chat_case(case_key,org,member_id,'suspend',72,
      'A changed request must use a different key.');
    raise exception 'Changed case reused an idempotency key';
  exception when unique_violation then null; end;
  begin
    perform public.open_community_chat_case(other_key,org,member_id,'suspend',72,
      'A second open case must be rejected.');
    raise exception 'Duplicate open case allowed';
  exception when unique_violation then null; end;
  begin
    perform public.open_community_chat_case(other_key,org,owner_id,'suspend',24,
      'A moderator cannot target the owner.');
    raise exception 'Moderator opened owner case';
  exception when insufficient_privilege then null; end;
  reset role;

  if (select count(*) from public.community_chat_cases where id=case_key)<>1
    or (select count(*) from public.notifications
      where type='community_chat_case' and related_id=case_key)<>2
    or not exists(select 1 from public.notifications
      where type='community_chat_case' and related_id=case_key
        and recipient_id=owner_id)
    or (select count(*) from community_private.community_chat_case_mail
      where case_id=case_key)<>1 then
    raise exception 'Case, notice and mail outbox were not atomic';
  end if;
  if exists(select 1 from public.community_chat_restrictions
    where community_id=org and user_id=member_id) then
    raise exception 'Opening a case restricted the user immediately';
  end if;

  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_cases where id=case_key) then
    raise exception 'Outsider read a private case';
  end if;
  begin
    perform public.submit_community_chat_case_defense(case_key,explanation);
    raise exception 'Outsider submitted a defense';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_chat_cases where id=case_key) then
    raise exception 'Subject cannot read own case';
  end if;
  perform public.submit_community_chat_case_defense(case_key,explanation);
  perform public.submit_community_chat_case_defense(case_key,explanation);
  begin
    perform public.submit_community_chat_case_defense(case_key,
      'Changing an already submitted defense must be rejected.');
    raise exception 'Defense was silently changed';
  exception when unique_violation then null; end;
  begin
    update public.community_chat_cases set status='resolved' where id=case_key;
    raise exception 'Subject edited the case directly';
  exception when insufficient_privilege then null; end;
  reset role;

  if (select defense_statement from public.community_chat_cases
    where id=case_key)<>explanation then
    raise exception 'Defense did not persist';
  end if;

  set local role service_role;
  claimed:=public.claim_community_chat_case_mail(3);
  if jsonb_array_length(claimed)<>1
    or claimed->0->>'case_id'<>case_key::text then
    raise exception 'Mail claim did not identify the case';
  end if;
  lease:=(claimed->0->>'lease_token')::uuid;
  if not public.finish_community_chat_case_mail(case_key,lease,false,'provider_unavailable') then
    raise exception 'Failed mail attempt was not acknowledged';
  end if;
  if (select status from public.community_chat_cases where id=case_key)<>'pending_notice' then
    raise exception 'Failed email started the defense clock';
  end if;
  update community_private.community_chat_case_mail
    set available_at=now()-interval '1 minute' where case_id=case_key;
  claimed:=public.claim_community_chat_case_mail(3);
  lease:=(claimed->0->>'lease_token')::uuid;
  if not public.finish_community_chat_case_mail(case_key,lease,true,null) then
    raise exception 'Provider acceptance was not acknowledged';
  end if;
  if public.finish_community_chat_case_mail(case_key,lease,true,null) then
    raise exception 'Stale lease acknowledged twice';
  end if;
  reset role;
  if not exists(select 1 from public.community_chat_cases
    where id=case_key and status='open' and notified_at is not null
      and defense_deadline=notified_at+interval '48 hours')
    or not exists(select 1 from community_private.community_chat_case_mail
      where case_id=case_key and delivered_at is not null) then
    raise exception 'Provider acceptance and defense window were not atomic';
  end if;
end;
$$;
rollback;

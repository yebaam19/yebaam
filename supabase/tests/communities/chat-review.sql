-- Supabase MCP test; fixtures and notification rows are rolled back.
begin;
do $$
declare people uuid[]; owner_id uuid; moderator_id uuid; member_id uuid;
  outsider_id uuid; admin_a uuid; admin_b uuid;
  org uuid:=gen_random_uuid(); request_id uuid;
  appeal_id uuid; current_version integer; decision_key uuid:=gen_random_uuid();
begin
  if has_table_privilege('anon','public.community_chat_review_requests','SELECT')
    or has_table_privilege('authenticated','public.community_chat_review_requests','INSERT')
    or has_table_privilege('authenticated','public.community_chat_review_requests','UPDATE')
    or has_table_privilege('authenticated','public.community_chat_review_requests','DELETE') then
    raise exception 'Review table grants are too broad';
  end if;
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id
    order by u.id limit 6
  ) candidates;
  if cardinality(people)<6 then raise exception 'Six profiles required'; end if;
  owner_id:=people[1]; moderator_id:=people[2];
  member_id:=people[3]; outsider_id:=people[4];
  admin_a:=people[5]; admin_b:=people[6];
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Review test','chat-review-'||org,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status) values
    (org,moderator_id,'MEMBER','active'),
    (org,member_id,'MEMBER','active'),
    (org,admin_a,'MEMBER','active'),
    (org,admin_b,'MEMBER','active');
  insert into public.community_profile_roles(community_id,user_id,role)
    values(org,moderator_id,'moderator'),(org,admin_a,'admin'),(org,admin_b,'admin');

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  perform public.set_community_chat_restriction(org,member_id,'suspend',24,
    'Repeated disruption in the community chat',decision_key);
  perform public.set_community_chat_restriction(org,member_id,'suspend',24,
    'Repeated disruption in the community chat',decision_key);
  begin
    perform public.set_community_chat_restriction(org,member_id,'suspend',72,
      'A different decision must use a new key.',decision_key);
    raise exception 'Decision key accepted different content';
  exception when unique_violation then null; end;
  reset role;
  if (select version from public.community_chat_restrictions
    where community_id=org and user_id=member_id)<>1 then
    raise exception 'A retry advanced the restriction version';
  end if;
  if (select count(*) from public.notifications
    where recipient_id=member_id and type='community_chat_decision')<>1 then
    raise exception 'Sanction notice missing';
  end if;

  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  begin
    perform public.submit_community_chat_review(org,'I disagree with this decision');
    raise exception 'Outsider submitted review';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  request_id:=public.submit_community_chat_review(org,
    'I would like to explain the context of the messages.');
  if request_id<>public.submit_community_chat_review(org,
    'I would like to explain the context of the messages.') then
    raise exception 'Duplicate defense request created';
  end if;
  if exists(select 1 from public.community_chat_review_requests
    where id=request_id and user_id<>member_id) then
    raise exception 'Review identity was forged';
  end if;
  begin
    perform public.submit_community_chat_review(org,
      'I want to appeal before my defense is reviewed.');
    raise exception 'Appeal submitted before review';
  exception when unique_violation then null; end;
  begin
    update public.community_chat_review_requests set status='lifted'
      where id=request_id;
    raise exception 'Affected member edited review directly';
  exception when insufficient_privilege then null; end;
  reset role;
  if (select count(*) from public.notifications
    where recipient_id=owner_id and type='community_chat_review'
      and related_id=request_id)<>0 then
    raise exception 'Sanction author received a defense notice';
  end if;
  if (select count(*) from public.notifications
    where recipient_id in (moderator_id,admin_a,admin_b)
      and type='community_chat_review' and related_id=request_id)<>3 then
    raise exception 'Eligible defense reviewers were not notified';
  end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_review_requests where id=request_id) then
    raise exception 'Sanction author read the defense';
  end if;
  begin
    perform public.resolve_community_chat_review(request_id,'uphold',
      'The sanction author cannot judge the defense.');
    raise exception 'Sanction author decided the defense';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  begin
    perform public.resolve_community_chat_review(request_id,'uphold',
      'Unauthorized review attempted by an outsider.');
    raise exception 'Outsider resolved review';
  exception when insufficient_privilege then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_chat_review_requests where id=request_id) then
    raise exception 'Independent moderator could not read the defense';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub',admin_a::text,true);
  set local role authenticated;
  perform public.resolve_community_chat_review(request_id,'uphold',
    'The message pattern supports the temporary limit.');
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  appeal_id:=public.submit_community_chat_review(org,
    'I appeal the decision and request an administrative review.');
  reset role;
  if (select count(*) from public.notifications
    where type='community_chat_review' and related_id=appeal_id)<>1
    or not exists(select 1 from public.notifications
      where type='community_chat_review' and related_id=appeal_id
        and recipient_id=admin_b) then
    raise exception 'Appeal was not routed to the independent administrator';
  end if;
  perform set_config('request.jwt.claim.sub',moderator_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_review_requests
    where id=appeal_id) then
    raise exception 'Moderator read an administrative appeal';
  end if;
  begin
    perform public.resolve_community_chat_review(appeal_id,'lift',
      'A moderator must not decide this appeal.');
    raise exception 'Moderator decided appeal';
  exception when insufficient_privilege then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_review_requests where id=appeal_id) then
    raise exception 'Sanction author read the appeal';
  end if;
  begin
    perform public.resolve_community_chat_review(appeal_id,'lift',
      'The sanction author cannot decide the appeal.');
    raise exception 'Sanction author decided appeal';
  exception when insufficient_privilege then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',admin_a::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_review_requests where id=appeal_id) then
    raise exception 'Defense reviewer read the appeal';
  end if;
  begin
    perform public.resolve_community_chat_review(appeal_id,'lift',
      'The defense reviewer cannot decide the appeal.');
    raise exception 'Defense reviewer decided appeal';
  exception when insufficient_privilege then null; end;
  reset role;
  perform set_config('request.jwt.claim.sub',admin_b::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_chat_review_requests where id=appeal_id) then
    raise exception 'Independent administrator could not read the appeal';
  end if;
  perform public.resolve_community_chat_review(appeal_id,'lift',
    'The appeal is accepted after reviewing the context.');
  reset role;
  if not exists(select 1 from public.community_chat_restrictions
    where community_id=org and user_id=member_id and revoked_at is not null) then
    raise exception 'Accepted appeal did not lift the restriction';
  end if;
  if (select count(*) from public.notifications
    where recipient_id=member_id and type='community_chat_review')<>2 then
    raise exception 'Review response notices missing';
  end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  perform public.set_community_chat_restriction(org,member_id,'suspend',12,
    'New disruptive messages after the prior review.');
  reset role;
  select version into current_version from public.community_chat_restrictions
    where community_id=org and user_id=member_id;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  request_id:=public.submit_community_chat_review(org,
    'I want to explain the new incident separately.');
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  perform public.set_community_chat_restriction(org,member_id,'suspend',24,
    'Additional evidence changed the restriction decision.');
  reset role;
  if not exists(select 1 from public.community_chat_review_requests
    where id=request_id and status='superseded') then
    raise exception 'Old request remained open after a new decision';
  end if;
  if (select version from public.community_chat_restrictions
    where community_id=org and user_id=member_id)<>current_version+1 then
    raise exception 'Decision version did not advance';
  end if;
end;
$$;
rollback;

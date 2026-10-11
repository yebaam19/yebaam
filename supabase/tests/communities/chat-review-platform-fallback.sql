-- Run through Supabase MCP. All users, permissions and decisions roll back.
begin;
do $$
declare people uuid[]; owner_id uuid; member_id uuid; reviewer_a uuid;
  reviewer_b uuid; outsider_id uuid; org uuid:=gen_random_uuid();
  defense_id uuid; appeal_id uuid; topic_id uuid:=gen_random_uuid();
  topic_slug text;
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id
    where not exists(select 1 from public.platform_admins a where a.user_id=u.id)
    order by u.id limit 5
  ) candidates;
  if cardinality(people)<5 then raise exception 'Five profiles required'; end if;
  owner_id:=people[1]; member_id:=people[2]; reviewer_a:=people[3];
  reviewer_b:=people[4]; outsider_id:=people[5];
  topic_slug:='chat-review-fallback-'||org;
  insert into public.platform_admins(user_id) values(reviewer_a),(reviewer_b);
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Review fallback test',topic_slug,'PRIVATE');
  insert into public.public_chat_topics
    (id,slug,name,owner_type,owner_id,is_archived,is_permanent)
    values(topic_id,topic_slug,'Private review room','community',org,false,true);
  insert into public.community_members(community_id,user_id,role,status)
    values(org,member_id,'MEMBER','active');

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  -- Privileged fixture: ordinary clients cannot call this retired RPC.
  perform public.set_community_chat_restriction(org,member_id,'block',null,
    'Repeated violations warrant a block pending review.',gen_random_uuid());
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  defense_id:=public.submit_community_chat_review(org,
    'Please reconsider the restriction after reading my account.');
  reset role;
  if (select count(*) from public.notifications
    where type='community_chat_review' and related_id=defense_id
      and recipient_id in (reviewer_a,reviewer_b))<>2 then
    raise exception 'Platform fallback reviewers did not receive the defense';
  end if;
  if exists(select 1 from public.notifications
    where type='community_chat_review' and related_id=defense_id
      and link<>'/feed/chat-publico/'||topic_slug) then
    raise exception 'Private review notification did not link to the room';
  end if;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_review_requests
    where id=defense_id) then
    raise exception 'Sanction author read the defense';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_review_requests
    where id=defense_id) then
    raise exception 'Outsider read the defense';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub',reviewer_a::text,true);
  set local role authenticated;
  if not exists(select 1 from public.public_chat_topics
    where id=topic_id) or not community_private.can_read_chat_topic(topic_id) then
    raise exception 'Platform reviewer cannot enter the private room';
  end if;
  if not exists(select 1 from public.community_chat_review_requests
    where id=defense_id) then
    raise exception 'Platform reviewer cannot read defense';
  end if;
  perform public.resolve_community_chat_review(defense_id,'uphold',
    'The temporary restriction remains after an independent review.');
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  appeal_id:=public.submit_community_chat_review(org,
    'I appeal and ask a different administrator to lift this block.');
  reset role;
  if not exists(select 1 from public.notifications
      where type='community_chat_review' and related_id=appeal_id
        and recipient_id=reviewer_b)
    or exists(select 1 from public.notifications
      where type='community_chat_review' and related_id=appeal_id
        and recipient_id in (owner_id,reviewer_a,outsider_id)) then
    raise exception 'Appeal was not routed to independent platform reviewers';
  end if;
  perform set_config('request.jwt.claim.sub',reviewer_a::text,true);
  set local role authenticated;
  if exists(select 1 from public.community_chat_review_requests
    where id=appeal_id) then
    raise exception 'First reviewer read the appeal';
  end if;
  begin
    perform public.resolve_community_chat_review(appeal_id,'lift',
      'The first reviewer must not decide this appeal.');
    raise exception 'First reviewer decided the appeal';
  exception when insufficient_privilege then null; end;
  reset role;

  perform set_config('request.jwt.claim.sub',reviewer_b::text,true);
  set local role authenticated;
  perform public.resolve_community_chat_review(appeal_id,'lift',
    'The appeal is accepted after checking the complete record.');
  reset role;
  if not exists(select 1 from public.community_chat_restrictions
    where community_id=org and user_id=member_id and revoked_at is not null) then
    raise exception 'Independent platform appeal did not lift the block';
  end if;
end;
$$;
rollback;

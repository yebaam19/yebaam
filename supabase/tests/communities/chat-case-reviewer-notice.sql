-- Supabase MCP fixture: alerts for a private owner-opened case, then rollback.
begin;
do $$
declare people uuid[]; owner_id uuid; member_id uuid; platform_id uuid;
  outsider_id uuid; org uuid:=gen_random_uuid(); topic_id uuid:=gen_random_uuid();
  case_id uuid:=gen_random_uuid(); topic_slug text;
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id
    where u.email is not null and u.email like '%@%'
      and not exists(select 1 from public.platform_admins a where a.user_id=u.id)
    order by u.id limit 4
  ) candidates;
  if cardinality(people)<4 then raise exception 'Four email profiles required'; end if;
  owner_id:=people[1]; member_id:=people[2];
  platform_id:=people[3]; outsider_id:=people[4];
  topic_slug:='chat-case-reviewer-'||org;
  insert into public.platform_admins(user_id) values(platform_id);
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Reviewer notice test',topic_slug,'PRIVATE');
  insert into public.community_members(community_id,user_id,role,status)
    values(org,member_id,'MEMBER','active');
  insert into public.public_chat_topics
    (id,slug,name,owner_type,owner_id,is_archived,is_permanent)
    values(topic_id,topic_slug,'Private case room','community',org,false,true);

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  set local role authenticated;
  perform public.open_community_chat_case(case_id,org,member_id,'suspend',24,
    'Repeated disruption in this community room.');
  perform public.open_community_chat_case(case_id,org,member_id,'suspend',24,
    'Repeated disruption in this community room.');
  reset role;

  if not exists(select 1 from public.notifications
      where type='community_chat_case' and related_id=case_id
        and recipient_id=member_id)
    or not exists(select 1 from public.notifications
      where type='community_chat_case' and related_id=case_id
        and recipient_id=platform_id
        and link='/feed/chat-publico/'||topic_slug)
    or exists(select 1 from public.notifications
      where type='community_chat_case' and related_id=case_id
        and recipient_id in (owner_id,outsider_id))
    or (select count(*) from public.notifications
      where type='community_chat_case' and related_id=case_id
        and recipient_id=platform_id)<>1 then
    raise exception 'Owner-opened case was not routed once to platform review';
  end if;

  perform set_config('request.jwt.claim.sub',platform_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.community_chat_cases where id=case_id)
    or not exists(select 1 from public.public_chat_topics where id=topic_id) then
    raise exception 'Platform reviewer cannot open the private case or room';
  end if;
  reset role;
end;
$$;
rollback;

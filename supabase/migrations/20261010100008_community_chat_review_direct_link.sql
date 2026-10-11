-- Link independent reviewers directly to the room, including private communities.
create or replace function community_private.notify_chat_review()
returns trigger language plpgsql security definer set search_path='' as $$
declare target_link text;
begin
  select '/feed/chat-publico/'||t.slug into target_link
    from public.public_chat_topics t
    where t.owner_type='community' and t.owner_id=new.community_id
    order by t.id limit 1;
  if target_link is null then
    select '/feed/comunidades/'||c.slug||'/chat' into target_link
      from public.communities c where c.id=new.community_id;
  end if;
  if tg_op='UPDATE' then
    insert into public.notifications
      (type,recipient_id,related_id,message,link)
    values ('community_chat_review',new.user_id,new.id,
      'Tu solicitud de revisión del chat comunitario recibió respuesta.',
      target_link)
    on conflict do nothing;
    return null;
  end if;

  with restriction as (
    select r.decided_by from public.community_chat_restrictions r
    where r.community_id=new.community_id and r.user_id=new.user_id
      and r.version=new.restriction_version
  ), defense as (
    select d.reviewed_by,d.status from public.community_chat_review_requests d
    where d.community_id=new.community_id and d.user_id=new.user_id
      and d.restriction_version=new.restriction_version and d.stage='defense'
  ), local_candidates as (
    select c.owner_id as user_id,'admin'::text as role
      from public.communities c where c.id=new.community_id
    union all
    select p.user_id,p.role from public.community_profile_roles p
      join public.community_members m
        on m.community_id=p.community_id and m.user_id=p.user_id
      where p.community_id=new.community_id and m.status='active'
  ), eligible_local as (
    select candidate.user_id from local_candidates candidate
    join restriction r on true left join defense d on true
    where candidate.user_id is distinct from r.decided_by
      and (new.stage='defense' and candidate.role in ('admin','moderator')
        or new.stage='appeal' and candidate.role='admin'
          and d.status='upheld'
          and candidate.user_id is distinct from d.reviewed_by)
  ), eligible_platform as (
    select p.user_id from public.platform_admins p
    join restriction r on true left join defense d on true
    where not exists(select 1 from eligible_local)
      and p.user_id is distinct from r.decided_by
      and (new.stage='defense' or new.stage='appeal'
        and d.status='upheld' and p.user_id is distinct from d.reviewed_by)
  )
  insert into public.notifications(type,recipient_id,related_id,message,link)
  select distinct 'community_chat_review',candidate.user_id,new.id,
    'Recibiste una solicitud de revisión de una decisión del chat comunitario.',
    target_link
  from (select user_id from eligible_local
    union all select user_id from eligible_platform) candidate
  on conflict do nothing;
  return null;
end;
$$;

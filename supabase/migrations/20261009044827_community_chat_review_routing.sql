-- Notify eligible, independent reviewers instead of always notifying the owner.
create or replace function community_private.notify_chat_review()
returns trigger language plpgsql security definer set search_path='' as $$
declare community_slug text;
begin
  select c.slug into community_slug from public.communities c
    where c.id=new.community_id;
  if tg_op='UPDATE' then
    insert into public.notifications
      (type,recipient_id,related_id,message,link)
    values ('community_chat_review',new.user_id,new.id,
      'Tu solicitud de revisión del chat comunitario recibió respuesta.',
      '/feed/comunidades/'||community_slug||'/chat')
    on conflict do nothing;
    return null;
  end if;

  insert into public.notifications
    (type,recipient_id,related_id,message,link)
  select distinct 'community_chat_review',candidate.user_id,new.id,
    'Recibiste una solicitud de revisión de una decisión del chat comunitario.',
    '/feed/comunidades/'||community_slug||'/chat'
  from (
    select c.owner_id as user_id,'admin'::text as role
      from public.communities c where c.id=new.community_id
    union all
    select p.user_id,p.role from public.community_profile_roles p
      join public.community_members m
        on m.community_id=p.community_id and m.user_id=p.user_id
      where p.community_id=new.community_id and m.status='active'
  ) candidate
  join public.community_chat_restrictions r
    on r.community_id=new.community_id and r.user_id=new.user_id
      and r.version=new.restriction_version
  left join public.community_chat_review_requests defense
    on defense.community_id=new.community_id and defense.user_id=new.user_id
      and defense.restriction_version=new.restriction_version
      and defense.stage='defense'
  where candidate.user_id is distinct from r.decided_by
    and (new.stage='defense' and candidate.role in ('admin','moderator')
      or new.stage='appeal' and candidate.role='admin'
        and defense.status='upheld'
        and candidate.user_id is distinct from defense.reviewed_by)
  on conflict do nothing;
  return null;
end;
$$;
revoke all on function community_private.notify_chat_review()
  from public,anon,authenticated;

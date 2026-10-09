-- A chat decision and its in-app notice commit in the same transaction.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in ('like','comment','follow','message','mention','friend_request',
    'friend_accept','music_article','community_chat_decision',
    'community_chat_review')
);
create unique index if not exists notifications_community_chat_event_idx
  on public.notifications(type,recipient_id,related_id)
  where type in ('community_chat_decision','community_chat_review');

create or replace function community_private.audit_chat_restriction()
returns trigger language plpgsql security definer set search_path='' as $$
declare event_id uuid; community_slug text;
begin
  insert into public.community_chat_restriction_audit
    (community_id,user_id,actor_id,operation,before_data,after_data)
  values (new.community_id,new.user_id,(select auth.uid()),
    case when new.revoked_at is null then 'restrict' else 'release' end,
    case when tg_op='UPDATE' then to_jsonb(old)-'decided_by'-'revoked_by' end,
    to_jsonb(new)-'decided_by'-'revoked_by')
  returning id into event_id;
  select slug into community_slug from public.communities where id=new.community_id;
  insert into public.notifications
    (type,recipient_id,related_id,message,link)
  values ('community_chat_decision',new.user_id,event_id,
    case when new.revoked_at is null then
      'Se limitó tu participación en el chat de una comunidad. Revisa el motivo y presenta tus descargos.'
    else 'Se levantó una restricción de tu chat comunitario.' end,
    '/feed/comunidades/'||community_slug||'/chat')
  on conflict do nothing;
  return null;
end;
$$;
revoke all on function community_private.audit_chat_restriction()
  from public,anon,authenticated;

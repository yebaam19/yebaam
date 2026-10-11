-- Case reviewers need a private, actionable notice before the defense clock
-- ends. Owner-opened cases go to platform admins; other cases go to the owner.
create function community_private.notify_chat_case_reviewer()
returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid; target_link text;
begin
  select c.owner_id into owner_id from public.communities c
    where c.id=new.community_id;
  select '/feed/chat-publico/'||t.slug into target_link
    from public.public_chat_topics t
    where t.owner_type='community' and t.owner_id=new.community_id
    order by t.id limit 1;
  if target_link is null then
    select '/feed/comunidades/'||c.slug||'/chat' into target_link
      from public.communities c where c.id=new.community_id;
  end if;
  if new.requested_by=owner_id then
    insert into public.notifications(type,recipient_id,related_id,message,link)
    select 'community_chat_case',p.user_id,new.id,
      'Hay un expediente del chat comunitario para revisión independiente.',
      target_link
    from public.platform_admins p
    where p.user_id is distinct from new.requested_by
      and p.user_id is distinct from new.user_id
    on conflict do nothing;
  else
    insert into public.notifications(type,recipient_id,related_id,message,link)
    values('community_chat_case',owner_id,new.id,
      'Hay un expediente del chat comunitario pendiente de revisión.',
      target_link)
    on conflict do nothing;
  end if;
  return null;
end;
$$;
revoke all on function community_private.notify_chat_case_reviewer()
  from public,anon,authenticated;
create trigger notify_chat_case_reviewer_insert
  after insert on public.community_chat_cases for each row
  execute function community_private.notify_chat_case_reviewer();

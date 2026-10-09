-- Pinned messages are institutional decisions, never sender-supplied fields.
alter table public.public_chat_messages
  add column if not exists is_pinned boolean not null default false;
create index if not exists public_chat_community_pins_idx
  on public.public_chat_messages(topic_id, created_at desc, id desc)
  where is_pinned and not is_deleted;

-- The old table-level INSERT grant would let any author set is_pinned=true.
-- Keep only columns used by the authenticated chat and city-chat writers.
revoke insert on public.public_chat_messages from authenticated;
grant insert (topic_id, sender_id, content, is_deleted, sender_kind,
  sender_nickname, sender_avatar_url, session_hash, media_type, media_meta,
  parent_message_id) on public.public_chat_messages to authenticated;

create or replace function public.set_community_chat_pin(target_message uuid, pin boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare target_community uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'sign_in_required' using errcode = '42501';
  end if;
  select topic.owner_id into target_community
    from public.public_chat_messages message
    join public.public_chat_topics topic on topic.id = message.topic_id
    where message.id = target_message and not message.is_deleted
      and topic.owner_type = 'community' and not topic.is_archived;
  if target_community is null
    or not community_private.can_manage_profile(target_community, 'moderation') then
    raise exception 'moderation_forbidden' using errcode = '42501';
  end if;
  update public.public_chat_messages set is_pinned = pin
    where id = target_message and is_pinned is distinct from pin;
  return true;
end;
$$;
revoke all on function public.set_community_chat_pin(uuid, boolean) from public, anon;
grant execute on function public.set_community_chat_pin(uuid, boolean) to authenticated;

-- Clients may only soft-delete chat messages. Message identity, room and
-- reply linkage must never be mutable through PostgREST UPDATE.
revoke update on public.public_chat_messages from authenticated;
grant update (is_deleted) on public.public_chat_messages to authenticated;

-- A reply must point at a visible, live message in its own room. The FK alone
-- allows linking across rooms and leaking context through reply counters.
create or replace function public.chat_message_reply_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.parent_message_id is not null and not exists (
    select 1 from public.public_chat_messages parent
    where parent.id = new.parent_message_id
      and parent.topic_id = new.topic_id
      and not parent.is_deleted
  ) then
    raise exception 'invalid_reply_parent' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.chat_message_reply_guard() from public, anon, authenticated;
drop trigger if exists chat_message_reply_guard on public.public_chat_messages;
create trigger chat_message_reply_guard
  before insert on public.public_chat_messages
  for each row execute function public.chat_message_reply_guard();

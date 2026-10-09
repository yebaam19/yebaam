-- The counter trigger must update a different author's row after an INSERT.
-- Keep that system write inside the trigger, without granting clients UPDATE
-- on reply_count or weakening the row policy.
create or replace function public.public_chat_messages_reply_count()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.parent_message_id is not null then
    update public.public_chat_messages
      set reply_count = reply_count + 1
      where id = new.parent_message_id;
  elsif tg_op = 'DELETE' and old.parent_message_id is not null then
    update public.public_chat_messages
      set reply_count = greatest(reply_count - 1, 0)
      where id = old.parent_message_id;
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function public.public_chat_messages_reply_count() from public, anon, authenticated;

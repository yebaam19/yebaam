-- reply_count represents visible replies, including after a soft delete or
-- restoration. The original trigger only watched physical INSERT/DELETE.
create or replace function public.public_chat_messages_reply_count()
returns trigger language plpgsql security definer set search_path = '' as $$
declare parent_id uuid; delta integer;
begin
  if tg_op = 'INSERT' then
    parent_id := new.parent_message_id;
    delta := case when new.is_deleted then 0 else 1 end;
  elsif tg_op = 'DELETE' then
    parent_id := old.parent_message_id;
    delta := case when old.is_deleted then 0 else -1 end;
  else
    parent_id := new.parent_message_id;
    delta := case
      when old.is_deleted = new.is_deleted then 0
      when new.is_deleted then -1
      else 1
    end;
  end if;
  if parent_id is not null and delta <> 0 then
    update public.public_chat_messages
      set reply_count = greatest(reply_count + delta, 0)
      where id = parent_id;
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function public.public_chat_messages_reply_count() from public, anon, authenticated;

drop trigger if exists public_chat_messages_reply_count_trg on public.public_chat_messages;
create trigger public_chat_messages_reply_count_trg
  after insert or delete or update of is_deleted on public.public_chat_messages
  for each row execute function public.public_chat_messages_reply_count();

-- Repair counters from existing visible rows. The grouping avoids a per-row
-- lookup while leaving messages with no replies at zero.
with visible_replies as (
  select parent_message_id, count(*)::integer as total
  from public.public_chat_messages
  where parent_message_id is not null and not is_deleted
  group by parent_message_id
), actual_counts as (
  select parent.id, coalesce(visible_replies.total, 0) as total
  from public.public_chat_messages parent
  left join visible_replies on visible_replies.parent_message_id = parent.id
)
update public.public_chat_messages parent
set reply_count = actual_counts.total
from actual_counts
where parent.id = actual_counts.id
  and parent.reply_count is distinct from actual_counts.total;

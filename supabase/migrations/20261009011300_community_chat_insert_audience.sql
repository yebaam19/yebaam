-- Server Actions use caller-bound writes, but direct PostgREST inserts need the
-- same audience check at the database boundary.
drop policy if exists public_chat_messages_insert_own on public.public_chat_messages;
create policy public_chat_messages_insert_own on public.public_chat_messages
for insert to authenticated with check (
  sender_id = (select auth.uid())
  and is_deleted = false
  and community_private.can_read_chat_topic(topic_id)
  and exists (
    select 1 from public.public_chat_topics topic
    where topic.id = topic_id and topic.is_archived = false
  )
);

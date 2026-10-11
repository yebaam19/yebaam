-- Restore discovery of explicitly public global rooms for signed-out visitors.
-- Community rooms retain their existing audience policy; no write grants change.
drop policy if exists public_chat_topics_select_global_anon on public.public_chat_topics;
create policy public_chat_topics_select_global_anon on public.public_chat_topics
for select to anon using (
  owner_type is null
  and visibility = 'public'
  and not is_archived
  and closed_at is null
  and (expires_at is null or expires_at > now())
);

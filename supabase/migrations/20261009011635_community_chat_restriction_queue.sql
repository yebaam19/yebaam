create index if not exists community_chat_restrictions_active_queue_idx
  on public.community_chat_restrictions(community_id,decided_at desc,user_id)
  where revoked_at is null;

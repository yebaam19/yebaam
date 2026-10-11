-- Match the keyset ordering used by the staff and subject case inboxes.
create index community_chat_cases_staff_feed_idx
  on public.community_chat_cases(community_id,created_at desc,id desc);
create index community_chat_cases_subject_feed_idx
  on public.community_chat_cases(community_id,user_id,created_at desc,id desc);

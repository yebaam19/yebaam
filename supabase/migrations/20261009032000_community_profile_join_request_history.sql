-- Preserve review history while allowing a person to request access again.
-- Only one request can be pending at a time for the same community/user.
alter table public.community_join_requests
  drop constraint if exists community_join_requests_community_id_user_id_status_key;
create unique index if not exists community_join_requests_one_pending_idx
  on public.community_join_requests(community_id, user_id)
  where status = 'pending';

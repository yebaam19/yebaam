-- Keep moderation evidence while allowing account erasure to anonymize actors.
alter table public.community_chat_moderation_log
  alter column actor_id drop not null;
alter table public.community_chat_moderation_log
  drop constraint if exists community_chat_moderation_log_actor_id_fkey;
alter table public.community_chat_moderation_log
  add constraint community_chat_moderation_log_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null;

alter table public.community_chat_reports
  alter column reporter_id drop not null;
alter table public.community_chat_reports
  drop constraint if exists community_chat_reports_reporter_id_fkey;
alter table public.community_chat_reports
  add constraint community_chat_reports_reporter_id_fkey
  foreign key (reporter_id) references auth.users(id) on delete set null;

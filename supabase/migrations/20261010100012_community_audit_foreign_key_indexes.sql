-- Keep account/community deletion and anonymization bounded as audit tables grow.
-- These foreign keys SET NULL or CASCADE when their parent disappears.
create index if not exists community_chat_cases_requested_by_idx
  on public.community_chat_cases(requested_by);
create index if not exists community_chat_cases_resolved_by_idx
  on public.community_chat_cases(resolved_by);
create index if not exists community_chat_moderation_log_actor_idx
  on public.community_chat_moderation_log(actor_id);
create index if not exists community_chat_moderation_log_community_idx
  on public.community_chat_moderation_log(community_id);
create index if not exists community_chat_reports_reviewer_idx
  on public.community_chat_reports(reviewer_id);
create index if not exists community_profile_role_audit_actor_idx
  on public.community_profile_role_audit(actor_user_id);
create index if not exists community_profile_role_audit_subject_idx
  on public.community_profile_role_audit(subject_user_id);

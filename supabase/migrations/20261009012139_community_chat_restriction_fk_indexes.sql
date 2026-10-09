create index if not exists community_chat_restrictions_decider_idx
  on public.community_chat_restrictions(decided_by) where decided_by is not null;
create index if not exists community_chat_restrictions_revoker_idx
  on public.community_chat_restrictions(revoked_by) where revoked_by is not null;
create index if not exists community_chat_restriction_audit_user_idx
  on public.community_chat_restriction_audit(user_id);
create index if not exists community_chat_restriction_audit_actor_idx
  on public.community_chat_restriction_audit(actor_id) where actor_id is not null;

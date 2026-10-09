-- The idempotency ledger is server-only; make the deny-all RLS intent explicit.
create policy community_chat_decision_requests_private
  on public.community_chat_decision_requests
  for all to authenticated using (false) with check (false);

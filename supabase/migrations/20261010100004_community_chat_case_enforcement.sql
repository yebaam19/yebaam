-- All ordinary restrictions now originate from a delivered, reviewed case.
-- The privileged resolver writes the restriction and its audit/notice atomically.
revoke execute on function public.set_community_chat_restriction(
  uuid,uuid,text,integer,text) from public,anon,authenticated;
revoke execute on function public.set_community_chat_restriction(
  uuid,uuid,text,integer,text,uuid) from public,anon,authenticated;

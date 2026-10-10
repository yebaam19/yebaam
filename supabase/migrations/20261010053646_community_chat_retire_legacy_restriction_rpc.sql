-- The six-argument RPC supplies an idempotency key. Keep the old overload
-- callable by its owner for that RPC's internal implementation only.
revoke execute on function public.set_community_chat_restriction(
  uuid,uuid,text,integer,text
) from authenticated;

-- Existing per-role EXECUTE survived revoking PUBLIC on this legacy function.
-- Anonymous readers use can_view_forum_space; they never need role checks.
revoke execute on function public.has_forum_role(uuid, text[]) from anon;

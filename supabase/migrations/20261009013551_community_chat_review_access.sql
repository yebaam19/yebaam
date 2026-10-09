-- Appeals contain personal statements and are visible only to administrators.
drop policy if exists community_chat_review_read
  on public.community_chat_review_requests;
create policy community_chat_review_read on public.community_chat_review_requests
  for select to authenticated using (
    user_id=(select auth.uid())
    or (stage='defense' and
      community_private.can_manage_profile(community_id,'moderation'))
    or (stage='appeal' and
      community_private.can_manage_profile(community_id,'settings'))
  );

-- Keep the same lock order as submission and sanction replacement:
-- restriction first, request second.
create or replace function public.resolve_community_chat_review(
  target_request uuid, decision text, decision_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); request_row public.community_chat_review_requests%rowtype;
  restriction public.community_chat_restrictions%rowtype; clean_reason text;
  request_community uuid; request_user uuid;
begin
  clean_reason:=btrim(coalesce(decision_reason,''));
  if actor is null or decision not in ('uphold','lift')
    or char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_review' using errcode='23514';
  end if;
  select community_id,user_id into request_community,request_user
    from public.community_chat_review_requests where id=target_request;
  if not found then raise exception 'review_forbidden' using errcode='42501'; end if;
  select * into restriction from public.community_chat_restrictions
    where community_id=request_community and user_id=request_user for update;
  if not found then raise exception 'review_stale' using errcode='P0002'; end if;
  select * into request_row from public.community_chat_review_requests
    where id=target_request for update;
  if not found or request_row.status<>'open'
    or not community_private.can_manage_profile(request_row.community_id,'moderation')
    or (request_row.stage='appeal'
      and not community_private.can_manage_profile(request_row.community_id,'settings')) then
    raise exception 'review_forbidden' using errcode='42501';
  end if;
  if restriction.version<>request_row.restriction_version
    or restriction.revoked_at is not null
    or (restriction.expires_at is not null and restriction.expires_at<=now())
    or (decision='lift' and restriction.kind='block'
      and not community_private.can_manage_profile(request_row.community_id,'settings')) then
    raise exception 'review_stale' using errcode='P0002';
  end if;
  update public.community_chat_review_requests set status=case
      when decision='lift' then 'lifted' else 'upheld' end,
    reviewed_by=actor,reviewed_at=now(),review_reason=clean_reason
    where id=target_request;
  if decision='lift' then
    perform public.release_community_chat_restriction(
      request_row.community_id,request_row.user_id,clean_reason);
  end if;
end;
$$;
revoke all on function public.resolve_community_chat_review(uuid,text,text)
  from public,anon;
grant execute on function public.resolve_community_chat_review(uuid,text,text)
  to authenticated;

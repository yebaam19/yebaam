-- A repeated submit returns the same request; a different statement cannot
-- silently replace a pending defense or appeal.
create or replace function public.submit_community_chat_review(
  target_community uuid, review_statement text
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); restriction public.community_chat_restrictions%rowtype;
  prior public.community_chat_review_requests%rowtype;
  next_stage text; result_id uuid; clean_statement text;
begin
  if actor is null then raise exception 'review_forbidden' using errcode='42501'; end if;
  clean_statement:=btrim(coalesce(review_statement,''));
  if char_length(clean_statement) not between 10 and 2000 then
    raise exception 'invalid_statement' using errcode='23514';
  end if;
  select * into restriction from public.community_chat_restrictions
    where community_id=target_community and user_id=actor for update;
  if not found or restriction.revoked_at is not null
    or (restriction.expires_at is not null and restriction.expires_at<=now()) then
    raise exception 'review_unavailable' using errcode='42501';
  end if;
  select * into prior from public.community_chat_review_requests
    where community_id=target_community and user_id=actor
      and restriction_version=restriction.version and stage='defense';
  if not found then
    next_stage:='defense';
  elsif prior.status='open' then
    if prior.statement=clean_statement then return prior.id; end if;
    raise exception 'review_already_submitted' using errcode='23505';
  elsif prior.status='upheld' then
    next_stage:='appeal';
  else
    raise exception 'review_unavailable' using errcode='42501';
  end if;
  select * into prior from public.community_chat_review_requests
    where community_id=target_community and user_id=actor
      and restriction_version=restriction.version and stage=next_stage;
  if found then
    if prior.statement=clean_statement then return prior.id; end if;
    raise exception 'review_already_submitted' using errcode='23505';
  end if;
  insert into public.community_chat_review_requests
    (community_id,user_id,restriction_version,stage,statement)
  values (target_community,actor,restriction.version,next_stage,clean_statement)
  returning id into result_id;
  return result_id;
end;
$$;
revoke all on function public.submit_community_chat_review(uuid,text)
  from public,anon;
grant execute on function public.submit_community_chat_review(uuid,text)
  to authenticated;

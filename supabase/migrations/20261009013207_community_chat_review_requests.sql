-- One defense and, after an upheld defense, one appeal per decision version.
create table public.community_chat_review_requests (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  user_id uuid not null,
  restriction_version integer not null check (restriction_version > 0),
  stage text not null check (stage in ('defense','appeal')),
  statement text not null check (char_length(btrim(statement)) between 10 and 2000),
  status text not null default 'open'
    check (status in ('open','upheld','lifted','superseded')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_reason text check (review_reason is null
    or char_length(btrim(review_reason)) between 10 and 500),
  constraint community_chat_review_restriction_fk
    foreign key (community_id,user_id)
    references public.community_chat_restrictions(community_id,user_id)
    on delete cascade,
  unique (community_id,user_id,restriction_version,stage)
);
create index community_chat_review_queue_idx on public.community_chat_review_requests
  (community_id,status,submitted_at desc,id);
create index community_chat_review_user_idx on public.community_chat_review_requests
  (user_id,community_id,restriction_version);
create index community_chat_review_reviewer_idx on public.community_chat_review_requests
  (reviewed_by) where reviewed_by is not null;
alter table public.community_chat_review_requests enable row level security;
revoke all on public.community_chat_review_requests from anon,authenticated;
grant select on public.community_chat_review_requests to authenticated;
grant all on public.community_chat_review_requests to service_role;
create policy community_chat_review_read on public.community_chat_review_requests
  for select to authenticated using (
    user_id=(select auth.uid())
    or community_private.can_manage_profile(community_id,'moderation')
  );

create or replace function public.submit_community_chat_review(
  target_community uuid, review_statement text
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); restriction public.community_chat_restrictions%rowtype;
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
  if exists(select 1 from public.community_chat_review_requests
    where community_id=target_community and user_id=actor
      and restriction_version=restriction.version and stage='defense') then
    next_stage:='appeal';
    if not exists(select 1 from public.community_chat_review_requests
      where community_id=target_community and user_id=actor
        and restriction_version=restriction.version and stage='defense'
        and status='upheld') then
      raise exception 'review_unavailable' using errcode='42501';
    end if;
  else next_stage:='defense'; end if;
  insert into public.community_chat_review_requests
    (community_id,user_id,restriction_version,stage,statement)
  values (target_community,actor,restriction.version,next_stage,clean_statement)
  on conflict (community_id,user_id,restriction_version,stage) do update
    set statement=community_chat_review_requests.statement
  returning id into result_id;
  return result_id;
end;
$$;
revoke all on function public.submit_community_chat_review(uuid,text)
  from public,anon;
grant execute on function public.submit_community_chat_review(uuid,text)
  to authenticated;

create or replace function public.resolve_community_chat_review(
  target_request uuid, decision text, decision_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); request_row public.community_chat_review_requests%rowtype;
  restriction public.community_chat_restrictions%rowtype; clean_reason text;
begin
  clean_reason:=btrim(coalesce(decision_reason,''));
  if actor is null or decision not in ('uphold','lift')
    or char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_review' using errcode='23514';
  end if;
  select * into request_row from public.community_chat_review_requests
    where id=target_request for update;
  if not found or request_row.status<>'open'
    or not community_private.can_manage_profile(request_row.community_id,'moderation')
    or (request_row.stage='appeal'
      and not community_private.can_manage_profile(request_row.community_id,'settings')) then
    raise exception 'review_forbidden' using errcode='42501';
  end if;
  select * into restriction from public.community_chat_restrictions
    where community_id=request_row.community_id and user_id=request_row.user_id for update;
  if not found or restriction.version<>request_row.restriction_version
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

create or replace function community_private.notify_chat_review()
returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; community_slug text;
begin
  select c.owner_id,c.slug into recipient,community_slug
    from public.communities c where c.id=new.community_id;
  if tg_op='UPDATE' then recipient:=new.user_id; end if;
  insert into public.notifications
    (type,recipient_id,related_id,message,link)
  values ('community_chat_review',recipient,new.id,
    case when tg_op='INSERT' then
      'Recibiste una solicitud de revisión de una decisión del chat comunitario.'
    else 'Tu solicitud de revisión del chat comunitario recibió respuesta.' end,
    '/feed/comunidades/'||community_slug||'/chat')
  on conflict do nothing;
  return null;
end;
$$;
revoke all on function community_private.notify_chat_review()
  from public,anon,authenticated;
create trigger notify_chat_review_insert after insert
  on public.community_chat_review_requests for each row
  execute function community_private.notify_chat_review();
create trigger notify_chat_review_update after update of status
  on public.community_chat_review_requests for each row
  when (old.status is distinct from new.status)
  execute function community_private.notify_chat_review();

create or replace function community_private.close_stale_chat_reviews()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.version<>old.version then
    update public.community_chat_review_requests set
      status=case when new.revoked_at is null then 'superseded' else 'lifted' end,
      reviewed_by=new.revoked_by, reviewed_at=now(),
      review_reason=case when new.revoked_at is null then
        'La decisión cambió antes de revisar la solicitud.'
        else new.revocation_reason end
    where community_id=new.community_id and user_id=new.user_id
      and restriction_version<new.version and status='open';
  end if;
  return null;
end;
$$;
revoke all on function community_private.close_stale_chat_reviews()
  from public,anon,authenticated;
create trigger close_stale_chat_reviews after update of version
  on public.community_chat_restrictions for each row
  execute function community_private.close_stale_chat_reviews();

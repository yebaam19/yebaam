-- Platform admins can independently review when the community has no eligible
-- reviewer. The sanction author and earlier reviewer remain disqualified.
create or replace function community_private.can_review_chat_request(
  target_community uuid,target_user uuid,target_version integer,target_stage text
) returns boolean language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.community_chat_restrictions r
    where r.community_id=target_community and r.user_id=target_user
      and r.version=target_version and r.revoked_at is null
      and (r.expires_at is null or r.expires_at>now())
      and r.decided_by is distinct from (select auth.uid())
      and (
        (target_stage='defense' and
          (community_private.can_manage_profile(target_community,'moderation')
            or public.is_platform_admin()))
        or (target_stage='appeal' and
          (community_private.can_manage_profile(target_community,'settings')
            or public.is_platform_admin())
          and exists (
            select 1 from public.community_chat_review_requests d
            where d.community_id=target_community and d.user_id=target_user
              and d.restriction_version=target_version and d.stage='defense'
              and d.status='upheld'
              and d.reviewed_by is distinct from (select auth.uid())
          ))
      )
  );
$$;

create or replace function public.release_community_chat_restriction(
  target_community uuid,target_user uuid,release_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); clean_reason text;
  platform_actor boolean:=coalesce(public.is_platform_admin(),false);
  is_admin boolean;
begin
  if actor is null or not (platform_actor or
      community_private.can_manage_profile(target_community,'moderation')) then
    raise exception 'restriction_forbidden' using errcode='42501';
  end if;
  is_admin:=platform_actor or community_private.can_manage_profile(
    target_community,'settings');
  clean_reason:=btrim(coalesce(release_reason,''));
  if char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_release_reason' using errcode='23514';
  end if;
  update public.community_chat_restrictions set
    revoked_at=now(),revoked_by=actor,revocation_reason=clean_reason,version=version+1
  where community_id=target_community and user_id=target_user and revoked_at is null
    and (kind<>'block' or is_admin);
  if not found then
    raise exception 'restriction_not_found' using errcode='P0002';
  end if;
end;
$$;

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
    or not community_private.can_review_chat_request(
      request_row.community_id,request_row.user_id,
      request_row.restriction_version,request_row.stage) then
    raise exception 'review_forbidden' using errcode='42501';
  end if;
  if restriction.version<>request_row.restriction_version
    or restriction.revoked_at is not null
    or (restriction.expires_at is not null and restriction.expires_at<=now())
    or (decision='lift' and restriction.kind='block'
      and not (community_private.can_manage_profile(
        request_row.community_id,'settings') or public.is_platform_admin())) then
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

create or replace function community_private.notify_chat_review()
returns trigger language plpgsql security definer set search_path='' as $$
declare community_slug text;
begin
  select c.slug into community_slug from public.communities c
    where c.id=new.community_id;
  if tg_op='UPDATE' then
    insert into public.notifications
      (type,recipient_id,related_id,message,link)
    values ('community_chat_review',new.user_id,new.id,
      'Tu solicitud de revisión del chat comunitario recibió respuesta.',
      '/feed/comunidades/'||community_slug||'/chat')
    on conflict do nothing;
    return null;
  end if;

  with restriction as (
    select r.decided_by from public.community_chat_restrictions r
    where r.community_id=new.community_id and r.user_id=new.user_id
      and r.version=new.restriction_version
  ), defense as (
    select d.reviewed_by,d.status from public.community_chat_review_requests d
    where d.community_id=new.community_id and d.user_id=new.user_id
      and d.restriction_version=new.restriction_version and d.stage='defense'
  ), local_candidates as (
    select c.owner_id as user_id,'admin'::text as role
      from public.communities c where c.id=new.community_id
    union all
    select p.user_id,p.role from public.community_profile_roles p
      join public.community_members m
        on m.community_id=p.community_id and m.user_id=p.user_id
      where p.community_id=new.community_id and m.status='active'
  ), eligible_local as (
    select candidate.user_id from local_candidates candidate
    join restriction r on true left join defense d on true
    where candidate.user_id is distinct from r.decided_by
      and (new.stage='defense' and candidate.role in ('admin','moderator')
        or new.stage='appeal' and candidate.role='admin'
          and d.status='upheld'
          and candidate.user_id is distinct from d.reviewed_by)
  ), eligible_platform as (
    select p.user_id from public.platform_admins p
    join restriction r on true left join defense d on true
    where not exists(select 1 from eligible_local)
      and p.user_id is distinct from r.decided_by
      and (new.stage='defense' or new.stage='appeal'
        and d.status='upheld' and p.user_id is distinct from d.reviewed_by)
  )
  insert into public.notifications(type,recipient_id,related_id,message,link)
  select distinct 'community_chat_review',candidate.user_id,new.id,
    'Recibiste una solicitud de revisión de una decisión del chat comunitario.',
    '/feed/comunidades/'||community_slug||'/chat'
  from (select user_id from eligible_local
    union all select user_id from eligible_platform) candidate
  on conflict do nothing;
  return null;
end;
$$;

-- A case is not a restriction. Its 48-hour defense clock starts only after
-- the registered-email notice has been accepted by the mail provider.
create table public.community_chat_cases (
  id uuid primary key,
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('suspend','block')),
  duration_hours integer,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  status text not null default 'pending_notice'
    check (status in ('pending_notice','open','resolved')),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  defense_deadline timestamptz,
  defense_statement text check (defense_statement is null
    or char_length(btrim(defense_statement)) between 10 and 2000),
  defense_submitted_at timestamptz,
  outcome text check (outcome is null or outcome in ('dismiss','warn','restrict')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolution_reason text check (resolution_reason is null
    or char_length(btrim(resolution_reason)) between 10 and 500),
  check ((kind='suspend' and duration_hours between 1 and 720)
    or (kind='block' and duration_hours is null)),
  check ((notified_at is null and defense_deadline is null)
    or (notified_at is not null and defense_deadline=notified_at+interval '48 hours')),
  check ((status='resolved')=(outcome is not null and resolved_at is not null))
);
create unique index community_chat_cases_one_open_idx
  on public.community_chat_cases(community_id,user_id)
  where status in ('pending_notice','open');
create index community_chat_cases_subject_idx
  on public.community_chat_cases(user_id,created_at desc,id);
create index community_chat_cases_queue_idx
  on public.community_chat_cases(community_id,status,created_at,id);
alter table public.community_chat_cases enable row level security;
revoke all on public.community_chat_cases from anon,authenticated;
grant select on public.community_chat_cases to authenticated;
grant all on public.community_chat_cases to service_role;
create policy community_chat_cases_read on public.community_chat_cases
  for select to authenticated using (
    user_id=(select auth.uid())
    or community_private.can_manage_profile(community_id,'moderation')
    or public.is_platform_admin()
  );

-- The email snapshot is deliberately absent from the caller-readable case.
create table community_private.community_chat_case_mail (
  case_id uuid primary key references public.community_chat_cases(id) on delete cascade,
  recipient_email text not null,
  available_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  first_attempt_at timestamptz,
  lease_token uuid,
  delivered_at timestamptz,
  last_error text
);
create index community_chat_case_mail_ready_idx
  on community_private.community_chat_case_mail(available_at,case_id)
  where delivered_at is null;
alter table community_private.community_chat_case_mail enable row level security;
revoke all on community_private.community_chat_case_mail
  from public,anon,authenticated;
grant select,update on community_private.community_chat_case_mail to service_role;

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in ('like','comment','follow','message','mention','friend_request',
    'friend_accept','music_article','community_chat_decision',
    'community_chat_review','community_chat_case')
);
create unique index notifications_community_chat_case_idx
  on public.notifications(type,recipient_id,related_id)
  where type='community_chat_case';

create or replace function public.open_community_chat_case(
  case_id uuid,target_community uuid,target_user uuid,
  proposed_kind text,proposed_hours integer,case_reason text
) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); owner_id uuid; email_address text;
  clean_reason text:=btrim(coalesce(case_reason,'')); is_admin boolean;
  prior public.community_chat_cases%rowtype; community_slug text;
begin
  is_admin:=community_private.can_manage_profile(target_community,'settings');
  if actor is null or case_id is null
    or not community_private.can_manage_profile(target_community,'moderation') then
    raise exception 'case_forbidden' using errcode='42501';
  end if;
  if char_length(clean_reason) not between 10 and 500
    or proposed_kind not in ('suspend','block')
    or (proposed_kind='suspend' and (proposed_hours is null or proposed_hours < 1
      or proposed_hours > case when is_admin then 720 else 72 end))
    or (proposed_kind='block' and (not is_admin or proposed_hours is not null)) then
    raise exception 'invalid_case' using errcode='23514';
  end if;
  select c.owner_id,c.slug into owner_id,community_slug
    from public.communities c where c.id=target_community;
  if owner_id is null or target_user is null or target_user in (actor,owner_id)
    or exists(select 1 from public.platform_admins p where p.user_id=target_user)
    or not exists(select 1 from public.community_members m
      where m.community_id=target_community and m.user_id=target_user
        and m.status='active')
    or (not is_admin and exists(select 1 from public.community_profile_roles r
      where r.community_id=target_community and r.user_id=target_user
        and r.role in ('admin','moderator'))) then
    raise exception 'case_target_forbidden' using errcode='42501';
  end if;
  select email into email_address from auth.users where id=target_user;
  if email_address is null or email_address !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'case_email_unavailable' using errcode='23514';
  end if;

  insert into public.community_chat_cases
    (id,community_id,user_id,requested_by,kind,duration_hours,reason)
  values (case_id,target_community,target_user,actor,proposed_kind,
    proposed_hours,clean_reason)
  on conflict (id) do nothing;
  if not found then
    select * into prior from public.community_chat_cases where id=case_id;
    if prior.community_id=target_community and prior.user_id=target_user
      and prior.requested_by=actor and prior.kind=proposed_kind
      and prior.duration_hours is not distinct from proposed_hours
      and prior.reason=clean_reason then return case_id; end if;
    raise exception 'case_request_conflict' using errcode='23505';
  end if;
  insert into community_private.community_chat_case_mail(case_id,recipient_email)
    values(case_id,email_address);
  insert into public.notifications(type,recipient_id,related_id,message,link)
    values('community_chat_case',target_user,case_id,
      'Se abrió una revisión de tu participación en un chat comunitario. Puedes presentar descargos antes de cualquier restricción.',
      '/feed/comunidades/'||community_slug||'/chat');
  return case_id;
end;
$$;
revoke all on function public.open_community_chat_case(uuid,uuid,uuid,text,integer,text)
  from public,anon;
grant execute on function public.open_community_chat_case(uuid,uuid,uuid,text,integer,text)
  to authenticated;

create or replace function public.submit_community_chat_case_defense(
  target_case uuid,statement text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); case_row public.community_chat_cases%rowtype;
  clean_statement text:=btrim(coalesce(statement,''));
begin
  if actor is null or char_length(clean_statement) not between 10 and 2000 then
    raise exception 'invalid_defense' using errcode='23514';
  end if;
  select * into case_row from public.community_chat_cases
    where id=target_case and user_id=actor for update;
  if not found or case_row.status not in ('pending_notice','open')
    or (case_row.defense_deadline is not null and now()>case_row.defense_deadline) then
    raise exception 'defense_unavailable' using errcode='42501';
  end if;
  if case_row.defense_statement is not null then
    if case_row.defense_statement=clean_statement then return; end if;
    raise exception 'defense_already_submitted' using errcode='23505';
  end if;
  update public.community_chat_cases set defense_statement=clean_statement,
    defense_submitted_at=now() where id=target_case;
end;
$$;
revoke all on function public.submit_community_chat_case_defense(uuid,text)
  from public,anon;
grant execute on function public.submit_community_chat_case_defense(uuid,text)
  to authenticated;

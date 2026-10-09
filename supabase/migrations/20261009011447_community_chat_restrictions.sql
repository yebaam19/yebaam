-- Community-level chat limits leave the rest of the account available.
create table if not exists public.community_chat_restrictions (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('suspend','block')),
  expires_at timestamptz,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revocation_reason text not null default '' check (char_length(revocation_reason) <= 500),
  version integer not null default 1 check (version > 0),
  primary key (community_id,user_id),
  check ((kind='suspend' and expires_at is not null)
    or (kind='block' and expires_at is null))
);
create index if not exists community_chat_restrictions_user_idx
  on public.community_chat_restrictions(user_id,community_id);
alter table public.community_chat_restrictions enable row level security;
revoke all on public.community_chat_restrictions from anon,authenticated;
grant select on public.community_chat_restrictions to authenticated;
grant all on public.community_chat_restrictions to service_role;
create policy community_chat_restrictions_read on public.community_chat_restrictions
  for select to authenticated using (
    user_id=(select auth.uid())
    or community_private.can_manage_profile(community_id,'moderation')
  );

create table if not exists public.community_chat_restriction_audit (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  operation text not null check (operation in ('restrict','release')),
  before_data jsonb,
  after_data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists community_chat_restriction_audit_scope_idx
  on public.community_chat_restriction_audit(community_id,created_at desc,id);
alter table public.community_chat_restriction_audit enable row level security;
revoke all on public.community_chat_restriction_audit from anon,authenticated;
grant select on public.community_chat_restriction_audit to authenticated;
grant all on public.community_chat_restriction_audit to service_role;
create policy community_chat_restriction_audit_staff_read
  on public.community_chat_restriction_audit for select to authenticated
  using (community_private.can_manage_profile(community_id,'moderation'));

create or replace function community_private.audit_chat_restriction()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.community_chat_restriction_audit
    (community_id,user_id,actor_id,operation,before_data,after_data)
  values (new.community_id,new.user_id,(select auth.uid()),
    case when new.revoked_at is null then 'restrict' else 'release' end,
    case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new));
  return null;
end;
$$;
revoke all on function community_private.audit_chat_restriction()
  from public,anon,authenticated;
create trigger audit_chat_restriction after insert or update
  on public.community_chat_restrictions for each row
  execute function community_private.audit_chat_restriction();

create or replace function public.set_community_chat_restriction(
  target_community uuid,target_user uuid,restriction_kind text,
  duration_hours integer,decision_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); owner_id uuid; clean_reason text;
  is_admin boolean;
begin
  is_admin:=community_private.can_manage_profile(target_community,'settings');
  if actor is null or not community_private.can_manage_profile(target_community,'moderation') then
    raise exception 'restriction_forbidden' using errcode='42501';
  end if;
  clean_reason:=btrim(coalesce(decision_reason,''));
  if char_length(clean_reason) not between 10 and 500
    or restriction_kind not in ('suspend','block')
    or (restriction_kind='suspend' and (duration_hours is null or duration_hours < 1
      or duration_hours > case when is_admin then 720 else 72 end))
    or (restriction_kind='block' and (not is_admin or duration_hours is not null)) then
    raise exception 'invalid_restriction' using errcode='23514';
  end if;
  select c.owner_id into owner_id from public.communities c where c.id=target_community;
  if owner_id is null or target_user is null or target_user in (actor,owner_id)
    or (not is_admin and exists(select 1 from public.community_profile_roles r
      where r.community_id=target_community and r.user_id=target_user
        and r.role in ('admin','moderator'))) then
    raise exception 'restriction_target_forbidden' using errcode='42501';
  end if;
  insert into public.community_chat_restrictions
    (community_id,user_id,kind,expires_at,reason,decided_by)
  values (target_community,target_user,restriction_kind,
    case when restriction_kind='suspend' then now()+make_interval(hours=>duration_hours) end,
    clean_reason,actor)
  on conflict (community_id,user_id) do update set
    kind=excluded.kind,expires_at=excluded.expires_at,reason=excluded.reason,
    decided_by=actor,decided_at=now(),revoked_at=null,revoked_by=null,
    revocation_reason='',version=community_chat_restrictions.version+1
  where is_admin or community_chat_restrictions.kind<>'block';
  if not found then
    raise exception 'restriction_target_forbidden' using errcode='42501';
  end if;
end;
$$;
revoke all on function public.set_community_chat_restriction(uuid,uuid,text,integer,text)
  from public,anon;
grant execute on function public.set_community_chat_restriction(uuid,uuid,text,integer,text)
  to authenticated;

create or replace function public.release_community_chat_restriction(
  target_community uuid,target_user uuid,release_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); clean_reason text; is_admin boolean;
begin
  if actor is null or not community_private.can_manage_profile(target_community,'moderation') then
    raise exception 'restriction_forbidden' using errcode='42501';
  end if;
  is_admin:=community_private.can_manage_profile(target_community,'settings');
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
revoke all on function public.release_community_chat_restriction(uuid,uuid,text)
  from public,anon;
grant execute on function public.release_community_chat_restriction(uuid,uuid,text)
  to authenticated;

create or replace function community_private.can_post_chat_topic(target_topic uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select community_private.can_read_chat_topic(target_topic) and not exists (
    select 1 from public.public_chat_topics topic
    join public.community_chat_restrictions restriction
      on restriction.community_id=topic.owner_id
      and restriction.user_id=(select auth.uid())
    where topic.id=target_topic and topic.owner_type='community'
      and restriction.revoked_at is null
      and (restriction.expires_at is null or restriction.expires_at>now())
  );
$$;
revoke all on function community_private.can_post_chat_topic(uuid)
  from public,anon,authenticated;
grant execute on function community_private.can_post_chat_topic(uuid)
  to authenticated,service_role;

drop policy if exists public_chat_messages_insert_own on public.public_chat_messages;
create policy public_chat_messages_insert_own on public.public_chat_messages
for insert to authenticated with check (
  sender_id=(select auth.uid()) and is_deleted=false
  and community_private.can_post_chat_topic(topic_id)
  and exists(select 1 from public.public_chat_topics topic
    where topic.id=topic_id and topic.is_archived=false)
);

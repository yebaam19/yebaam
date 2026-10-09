alter table public.public_chat_messages
  add column if not exists moderation_hidden_at timestamptz,
  add column if not exists moderation_reason text not null default '',
  add column if not exists moderated_by uuid references auth.users(id) on delete set null;

create table if not exists public.community_chat_moderation_log (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  message_id uuid not null references public.public_chat_messages(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('hide','restore')),
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  message_snapshot jsonb,
  created_at timestamptz not null default now()
);
create index if not exists community_chat_moderation_log_message_idx
  on public.community_chat_moderation_log(message_id, created_at desc, id desc);
alter table public.community_chat_moderation_log enable row level security;
revoke all on public.community_chat_moderation_log from anon, authenticated;
grant select on public.community_chat_moderation_log to authenticated;
grant all on public.community_chat_moderation_log to service_role;
drop policy if exists community_chat_moderation_log_staff_read on public.community_chat_moderation_log;
create policy community_chat_moderation_log_staff_read
  on public.community_chat_moderation_log for select to authenticated
  using (community_private.can_manage_profile(community_id, 'moderation'));

-- A sender may undo their own soft deletion, but cannot undo a moderator's
-- removal through the ordinary column-level UPDATE grant.
create or replace function public.guard_moderated_chat_restore()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.moderation_hidden_at is not null and new.is_deleted = false
    and current_user in ('anon','authenticated') then
    raise exception 'moderated_message_restore_forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_moderated_chat_restore() from public, anon, authenticated;
drop trigger if exists guard_moderated_chat_restore on public.public_chat_messages;
create trigger guard_moderated_chat_restore before update of is_deleted
  on public.public_chat_messages for each row
  execute function public.guard_moderated_chat_restore();

create or replace function public.review_community_chat_report(
  target_report uuid, decision text, review_note text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare report_row public.community_chat_reports%rowtype;
  message_row public.public_chat_messages%rowtype; clean_note text;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  clean_note := btrim(coalesce(review_note, ''));
  if decision not in ('dismiss','hide') or char_length(clean_note) not between 10 and 500 then
    raise exception 'invalid_review' using errcode = '23514';
  end if;
  select * into report_row from public.community_chat_reports
    where id = target_report for update;
  if not found or report_row.status <> 'open'
    or not community_private.can_manage_profile(report_row.community_id, 'moderation') then
    raise exception 'review_forbidden' using errcode = '42501';
  end if;
  if decision = 'hide' then
    select * into message_row from public.public_chat_messages
      where id = report_row.message_id for update;
    if message_row.moderation_hidden_at is null and not message_row.is_deleted then
      insert into public.community_chat_moderation_log
        (community_id,message_id,actor_id,action,reason,message_snapshot)
      values (report_row.community_id,report_row.message_id,(select auth.uid()),'hide',clean_note,
        jsonb_build_object('content',message_row.content,'media_url',message_row.media_url,
          'media_type',message_row.media_type,'media_meta',message_row.media_meta));
      update public.public_chat_messages set
        content = 'Contenido retirado por moderación', media_url = null,
        media_type = null, media_meta = null, is_deleted = true, is_pinned = false,
        moderation_hidden_at = now(), moderation_reason = clean_note,
        moderated_by = (select auth.uid())
      where id = report_row.message_id;
    end if;
    update public.community_chat_reports set status = 'resolved',
      reviewed_at = now(), reviewer_id = (select auth.uid()), reviewer_note = clean_note
    where message_id = report_row.message_id and status = 'open';
  else
    update public.community_chat_reports set status = 'dismissed',
      reviewed_at = now(), reviewer_id = (select auth.uid()), reviewer_note = clean_note
    where id = target_report;
  end if;
  return true;
end;
$$;
revoke all on function public.review_community_chat_report(uuid,text,text) from public,anon;
grant execute on function public.review_community_chat_report(uuid,text,text) to authenticated;

create or replace function public.restore_community_chat_message(
  target_message uuid, restore_reason text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare message_row public.public_chat_messages%rowtype;
  snapshot jsonb; clean_reason text; target_community uuid;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  clean_reason := btrim(coalesce(restore_reason, ''));
  if char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_restore_reason' using errcode = '23514';
  end if;
  select * into message_row from public.public_chat_messages
    where id = target_message for update;
  select topic.owner_id into target_community from public.public_chat_topics topic
    where topic.id = message_row.topic_id and topic.owner_type = 'community';
  if target_community is null or message_row.moderation_hidden_at is null
    or not community_private.can_manage_profile(target_community, 'moderation') then
    raise exception 'restore_forbidden' using errcode = '42501';
  end if;
  select log.message_snapshot into snapshot from public.community_chat_moderation_log log
    where log.message_id = target_message and log.action = 'hide'
    order by log.created_at desc, log.id desc limit 1;
  if snapshot is null then raise exception 'missing_moderation_snapshot'; end if;
  update public.public_chat_messages set
    content = snapshot->>'content', media_url = snapshot->>'media_url',
    media_type = snapshot->>'media_type', media_meta = snapshot->'media_meta',
    is_deleted = false, moderation_hidden_at = null, moderation_reason = '', moderated_by = null
  where id = target_message;
  insert into public.community_chat_moderation_log
    (community_id,message_id,actor_id,action,reason)
  values (target_community,target_message,(select auth.uid()),'restore',clean_reason);
  return true;
end;
$$;
revoke all on function public.restore_community_chat_message(uuid,text) from public,anon;
grant execute on function public.restore_community_chat_message(uuid,text) to authenticated;

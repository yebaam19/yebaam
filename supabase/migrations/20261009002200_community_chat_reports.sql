-- Reports are private records. Only a signed-in reader of the community room
-- may create one; staff review is a separate, audited operation.
create table if not exists public.community_chat_reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  message_id uuid not null references public.public_chat_messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_note text not null default '' check (char_length(reviewer_note) <= 500),
  unique (message_id, reporter_id)
);
create index if not exists community_chat_reports_queue_idx
  on public.community_chat_reports(community_id, status, created_at desc, id);
create index if not exists community_chat_reports_reporter_idx
  on public.community_chat_reports(reporter_id, created_at desc);
alter table public.community_chat_reports enable row level security;
revoke all on public.community_chat_reports from anon, authenticated;
grant select on public.community_chat_reports to authenticated;
grant all on public.community_chat_reports to service_role;

drop policy if exists community_chat_reports_read on public.community_chat_reports;
create policy community_chat_reports_read on public.community_chat_reports
  for select to authenticated using (
    reporter_id = (select auth.uid())
    or community_private.can_manage_profile(community_id, 'moderation')
  );

create or replace function public.report_community_chat_message(
  target_message uuid, report_reason text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare target_community uuid; report_id uuid; clean_reason text;
begin
  if (select auth.uid()) is null then
    raise exception 'sign_in_required' using errcode = '42501';
  end if;
  clean_reason := btrim(coalesce(report_reason, ''));
  if char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_report_reason' using errcode = '23514';
  end if;
  select topic.owner_id into target_community
    from public.public_chat_messages message
    join public.public_chat_topics topic on topic.id = message.topic_id
    where message.id = target_message and not message.is_deleted
      and topic.owner_type = 'community' and not topic.is_archived
      and community_private.can_read_chat_topic(topic.id);
  if target_community is null then
    raise exception 'report_forbidden' using errcode = '42501';
  end if;
  insert into public.community_chat_reports(community_id, message_id, reporter_id, reason)
    values (target_community, target_message, (select auth.uid()), clean_reason)
    on conflict (message_id, reporter_id) do nothing
    returning id into report_id;
  if report_id is null then
    select id into report_id from public.community_chat_reports
      where message_id = target_message and reporter_id = (select auth.uid());
  end if;
  return report_id;
end;
$$;
revoke all on function public.report_community_chat_message(uuid, text) from public, anon;
grant execute on function public.report_community_chat_message(uuid, text) to authenticated;

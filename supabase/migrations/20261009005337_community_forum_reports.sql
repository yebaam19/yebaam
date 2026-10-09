-- Keep reports after a post is removed so staff can audit the decision.
-- No browser role may write report rows directly; both commands verify auth.
create table if not exists public.community_forum_reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  post_id uuid not null,
  topic_id uuid not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  post_snapshot text not null,
  topic_title text not null,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_note text not null default '' check (char_length(reviewer_note) <= 500)
);
create unique index if not exists community_forum_reports_once_idx
  on public.community_forum_reports(post_id, reporter_id) where reporter_id is not null;
create index if not exists community_forum_reports_queue_idx
  on public.community_forum_reports(community_id, status, created_at desc, id desc);
alter table public.community_forum_reports enable row level security;
revoke all on public.community_forum_reports from anon, authenticated;
grant select on public.community_forum_reports to authenticated;
grant all on public.community_forum_reports to service_role;
drop policy if exists community_forum_reports_staff_read on public.community_forum_reports;
create policy community_forum_reports_staff_read on public.community_forum_reports
  for select to authenticated using (
    community_private.can_manage_profile(community_id, 'moderation')
  );

create or replace function public.report_community_forum_post(target_post uuid, report_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target record; report_id uuid; clean_reason text;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  clean_reason := btrim(coalesce(report_reason, ''));
  if char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_report_reason' using errcode = '23514';
  end if;
  select p.id, p.topic_id, p.content, t.title, s.owner_id as community_id into target
    from public.forum_posts p
    join public.forum_topics t on t.id = p.topic_id
    join public.forums f on f.id = t.forum_id
    join public.forum_categories c on c.id = f.category_id
    join public.forum_spaces s on s.id = c.space_id
    where p.id = target_post and s.owner_type = 'community'
      and public.can_view_forum_by_topic(p.topic_id);
  if not found then raise exception 'report_forbidden' using errcode = '42501'; end if;
  insert into public.community_forum_reports
    (community_id,post_id,topic_id,reporter_id,reason,post_snapshot,topic_title)
    values (target.community_id,target.id,target.topic_id,(select auth.uid()),
      clean_reason,target.content,target.title)
    on conflict (post_id, reporter_id) where reporter_id is not null do nothing
    returning id into report_id;
  if report_id is null then
    select id into report_id from public.community_forum_reports
      where post_id = target_post and reporter_id = (select auth.uid());
  end if;
  return report_id;
end;
$$;
revoke all on function public.report_community_forum_post(uuid,text) from public,anon;
grant execute on function public.report_community_forum_post(uuid,text) to authenticated;

create or replace function public.review_community_forum_report(
  target_report uuid, decision text, review_note text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare report_row public.community_forum_reports%rowtype; clean_note text; current_space uuid;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  clean_note := btrim(coalesce(review_note, ''));
  if decision not in ('dismiss','remove') or char_length(clean_note) not between 10 and 500 then
    raise exception 'invalid_review' using errcode = '23514';
  end if;
  select * into report_row from public.community_forum_reports
    where id = target_report for update;
  if not found or report_row.status <> 'open'
    or not community_private.can_manage_profile(report_row.community_id, 'moderation') then
    raise exception 'review_forbidden' using errcode = '42501';
  end if;
  if decision = 'remove' then
    select public.forum_space_of_topic(p.topic_id) into current_space
      from public.forum_posts p where p.id = report_row.post_id for update;
    if current_space is not null and not exists (
      select 1 from public.forum_spaces s where s.id = current_space
        and s.owner_type = 'community' and s.owner_id = report_row.community_id
    ) then raise exception 'report_target_changed' using errcode = '42501'; end if;
    delete from public.forum_posts where id = report_row.post_id;
    update public.community_forum_reports set status = 'resolved',
      reviewed_at = now(), reviewer_id = (select auth.uid()), reviewer_note = clean_note
      where post_id = report_row.post_id and status = 'open';
  else
    update public.community_forum_reports set status = 'dismissed',
      reviewed_at = now(), reviewer_id = (select auth.uid()), reviewer_note = clean_note
      where id = target_report;
  end if;
  return true;
end;
$$;
revoke all on function public.review_community_forum_report(uuid,text,text) from public,anon;
grant execute on function public.review_community_forum_report(uuid,text,text) to authenticated;

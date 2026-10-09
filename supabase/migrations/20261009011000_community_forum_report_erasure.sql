-- Reports are user interactions. Erase a reporter's reports with their account;
-- retain only non-personal decision metadata when the reported author leaves.
alter table public.community_forum_reports
  add column if not exists post_author_id uuid references auth.users(id) on delete set null;
create index if not exists community_forum_reports_author_idx
  on public.community_forum_reports(post_author_id) where post_author_id is not null;
alter table public.community_forum_reports
  drop constraint if exists community_forum_reports_reporter_id_fkey;
alter table public.community_forum_reports
  add constraint community_forum_reports_reporter_id_fkey
  foreign key (reporter_id) references auth.users(id) on delete cascade;

create or replace function public.redact_community_forum_report_on_erasure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.post_author_id is not null and new.post_author_id is null then
    new.post_snapshot := 'Contenido eliminado con la cuenta';
    new.topic_title := 'Tema eliminado con la cuenta';
    new.reason := 'Reporte anonimizado por eliminación de cuenta';
    new.reviewer_note := '';
  end if;
  if old.reviewer_id is not null and new.reviewer_id is null then
    new.reviewer_note := '';
  end if;
  return new;
end;
$$;
revoke all on function public.redact_community_forum_report_on_erasure()
  from public, anon, authenticated;
drop trigger if exists redact_community_forum_report_on_erasure
  on public.community_forum_reports;
create trigger redact_community_forum_report_on_erasure
  before update of post_author_id, reviewer_id on public.community_forum_reports
  for each row execute function public.redact_community_forum_report_on_erasure();

create or replace function public.report_community_forum_post(target_post uuid, report_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target record; report_id uuid; clean_reason text;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  clean_reason := btrim(coalesce(report_reason, ''));
  if char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_report_reason' using errcode = '23514';
  end if;
  select p.id, p.topic_id, p.author_id, p.content, t.title, s.owner_id as community_id into target
    from public.forum_posts p
    join public.forum_topics t on t.id = p.topic_id
    join public.forums f on f.id = t.forum_id
    join public.forum_categories c on c.id = f.category_id
    join public.forum_spaces s on s.id = c.space_id
    where p.id = target_post and s.owner_type = 'community'
      and public.can_view_forum_by_topic(p.topic_id);
  if not found then raise exception 'report_forbidden' using errcode = '42501'; end if;
  insert into public.community_forum_reports
    (community_id,post_id,topic_id,post_author_id,reporter_id,reason,post_snapshot,topic_title)
    values (target.community_id,target.id,target.topic_id,target.author_id,(select auth.uid()),
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

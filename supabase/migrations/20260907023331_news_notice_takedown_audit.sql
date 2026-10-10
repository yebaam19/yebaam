-- Notice-and-takedown records: every report has a 24-hour deadline and every
-- admin moderation decision is retained in an append-only audit trail.
create table if not exists public.news_reports (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null check (reason in ('copyright', 'defamation', 'privacy', 'misinformation', 'other')),
  details text not null check (char_length(trim(details)) between 10 and 4000),
  status text not null default 'pending' check (status in ('pending', 'triaged', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '24 hours'),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  check ((status in ('resolved', 'rejected')) = (resolved_at is not null)
  )
);
create index if not exists news_reports_due_idx on public.news_reports (status, due_at);
create table if not exists public.news_moderation_audit (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.news_articles(id) on delete set null,
  report_id uuid references public.news_reports(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('report_created', 'triaged', 'removed', 'restored', 'featured', 'unfeatured')),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists news_moderation_audit_article_idx on public.news_moderation_audit (article_id, created_at desc);
create or replace function public.news_audit_article_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status = 'removed' then
    insert into public.news_moderation_audit(article_id, actor_id, action, reason)
    values (new.id, auth.uid(), 'removed', 'Notice-and-takedown');
  elsif new.is_featured is distinct from old.is_featured then
    insert into public.news_moderation_audit(article_id, actor_id, action)
    values (new.id, auth.uid(), case when new.is_featured then 'featured' else 'unfeatured' end);
  end if;
  return new;
end
$$;
drop trigger if exists news_article_moderation_audit on public.news_articles;
create trigger news_article_moderation_audit after update on public.news_articles for each row execute function public.news_audit_article_moderation();
alter table public.news_reports enable row level security;
alter table public.news_moderation_audit enable row level security;
create policy "reporters and admins can read news reports" on public.news_reports for select using (reporter_id = auth.uid() or public.news_is_platform_admin());
create policy "authenticated users can report news" on public.news_reports for insert with check (reporter_id = auth.uid());
create policy "admins process news reports" on public.news_reports for update using (public.news_is_platform_admin()) with check (public.news_is_platform_admin());
create policy "admins can read moderation audit" on public.news_moderation_audit for select using (public.news_is_platform_admin());
create policy "moderation audit is append only for admins" on public.news_moderation_audit for insert with check (public.news_is_platform_admin());

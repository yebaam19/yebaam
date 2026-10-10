create table if not exists public.news_recommendations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.news_articles(id) on delete cascade,
  score numeric not null default 1 check (score >= 0),
  reason text not null default 'interacción',
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

create index if not exists news_recommendations_user_idx
  on public.news_recommendations (user_id, score desc, created_at desc);

alter table public.news_recommendations enable row level security;

create policy "users read their news recommendations"
  on public.news_recommendations for select
  using (user_id = auth.uid() or public.news_is_platform_admin());

create policy "platform admins manage news recommendations"
  on public.news_recommendations for all
  using (public.news_is_platform_admin())
  with check (public.news_is_platform_admin());

create or replace function public.news_record_recommendation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.news_recommendations (user_id, article_id, score, reason)
  values (new.user_id, new.article_id, 1, 'interacción')
  on conflict (user_id, article_id)
  do update set score = public.news_recommendations.score + 1, created_at = now();
  return new;
end;
$$;

drop trigger if exists news_reaction_recommendation on public.news_reactions;
create trigger news_reaction_recommendation
after insert on public.news_reactions
for each row execute function public.news_record_recommendation();

drop trigger if exists news_save_recommendation on public.news_saves;
create trigger news_save_recommendation
after insert on public.news_saves
for each row execute function public.news_record_recommendation();

create or replace function public.news_is_city_manager(p_city_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.news_is_platform_admin()
    or exists (
      select 1 from public.city_admins ca
      where ca.city_id = p_city_id
        and ca.user_id = auth.uid()
        and ca.role in ('owner', 'franchise', 'contractor')
    )
$$;

-- News portal: cities, national and international reporting, source ownership,
-- reader interactions, authorised republication, and clearly labelled adverts.
-- The policy layer deliberately permits only published public editorial content.

create table if not exists public.news_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 80),
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  website_url text,
  logo_cf_image_id text,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  city_id uuid references public.cities(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 5 and 180),
  excerpt text not null check (char_length(trim(excerpt)) between 20 and 500),
  content text not null check (char_length(trim(content)) >= 80),
  cover_cf_image_id text,
  video_stream_uid text,
  section_id uuid not null references public.news_sections(id) on delete restrict,
  source_id uuid not null references public.news_sources(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  city_id uuid references public.cities(id) on delete set null,
  scope text not null check (scope in ('local', 'regional', 'national', 'international')),
  status text not null default 'draft' check (status in ('draft', 'published', 'removed')),
  is_featured boolean not null default false,
  is_sponsored boolean not null default false,
  ai_disclosure boolean not null default false,
  published_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published') = (published_at is not null)),
  check (not is_sponsored or content ilike '%#Publicidad%' or content ilike '%#Patrocinio%')
);

create index if not exists news_articles_published_feed_idx
  on public.news_articles (status, scope, city_id, section_id, published_at desc);
create index if not exists news_articles_source_idx on public.news_articles (source_id, published_at desc);

create table if not exists public.news_reactions (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like', 'insightful', 'important')),
  created_at timestamptz not null default now(),
  primary key (article_id, user_id, kind)
);

create table if not exists public.news_saves (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.news_comments(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_comments_article_idx on public.news_comments (article_id, created_at);

create table if not exists public.news_replicas (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  entity_type text not null check (entity_type in ('professional_profile', 'page', 'organization')),
  entity_id uuid not null,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (article_id, entity_type, entity_id)
);

create table if not exists public.news_ad_slots (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('home_top', 'home_inline', 'article_inline', 'sidebar')),
  label text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (placement)
);

create table if not exists public.news_ads (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.news_ad_slots(id) on delete cascade,
  advertiser_name text not null,
  headline text not null,
  destination_url text not null,
  image_cf_image_id text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.news_module_settings (
  singleton boolean primary key default true check (singleton),
  news_enabled boolean not null default true,
  videos_enabled boolean not null default true,
  weather_enabled boolean not null default true,
  trends_enabled boolean not null default true,
  ads_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.news_sections (slug, name, description, position) values
  ('politica', 'Política', 'Actualidad política y ciudadanía.', 10),
  ('deportes', 'Deportes', 'Deporte local, nacional e internacional.', 20),
  ('tecnologia', 'Tecnología', 'Innovación, ciencia y tecnología.', 30),
  ('cultura-entretenimiento', 'Cultura y entretenimiento', 'Arte, cultura y espectáculos.', 40),
  ('economia', 'Economía', 'Economía, emprendimiento y empleo.', 50)
on conflict (slug) do nothing;

insert into public.news_ad_slots (placement, label) values
  ('home_top', 'Portada superior'),
  ('home_inline', 'Entre noticias'),
  ('article_inline', 'Dentro del artículo'),
  ('sidebar', 'Barra lateral')
on conflict (placement) do nothing;

insert into public.news_module_settings (singleton) values (true)
on conflict (singleton) do nothing;

create or replace function public.news_is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

create or replace function public.news_can_publish(author uuid, source uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select author = auth.uid()
    and public.has_verified_professional_profile()
    and exists (
      select 1 from public.news_sources s
      where s.id = source and s.owner_id = auth.uid() and s.status = 'approved'
    )
$$;

alter table public.news_sections enable row level security;
alter table public.news_sources enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_reactions enable row level security;
alter table public.news_saves enable row level security;
alter table public.news_comments enable row level security;
alter table public.news_replicas enable row level security;
alter table public.news_ad_slots enable row level security;
alter table public.news_ads enable row level security;
alter table public.news_module_settings enable row level security;

create policy "news sections are readable" on public.news_sections for select using (is_active or public.news_is_platform_admin());
create policy "news sections managed by platform admins" on public.news_sections for all using (public.news_is_platform_admin()) with check (public.news_is_platform_admin());

create policy "approved sources are readable" on public.news_sources for select using (status = 'approved' or owner_id = auth.uid() or public.news_is_platform_admin());
create policy "professionals can propose sources" on public.news_sources for insert with check (owner_id = auth.uid() and public.has_verified_professional_profile());
create policy "source owners may update pending sources" on public.news_sources for update using (owner_id = auth.uid() and status = 'pending') with check (owner_id = auth.uid() and status = 'pending');
create policy "platform admins manage sources" on public.news_sources for all using (public.news_is_platform_admin()) with check (public.news_is_platform_admin());

create policy "published news is readable" on public.news_articles for select using (status = 'published' or author_id = auth.uid() or public.news_is_platform_admin());
create policy "verified professionals publish through approved source" on public.news_articles for insert with check (public.news_can_publish(author_id, source_id));
create policy "authors edit drafts and platform admins moderate" on public.news_articles for update using ((author_id = auth.uid() and status = 'draft') or public.news_is_platform_admin()) with check ((author_id = auth.uid() and status = 'draft' and public.news_can_publish(author_id, source_id)) or public.news_is_platform_admin());
create policy "authors delete drafts and platform admins remove" on public.news_articles for delete using ((author_id = auth.uid() and status = 'draft') or public.news_is_platform_admin());

create policy "news reactions are readable" on public.news_reactions for select using (true);
create policy "users manage their reactions" on public.news_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage their saved news" on public.news_saves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "visible comments are readable" on public.news_comments for select using (status = 'visible' or author_id = auth.uid() or public.news_is_platform_admin());
create policy "users create comments" on public.news_comments for insert with check (author_id = auth.uid());
create policy "authors edit visible comments" on public.news_comments for update using (author_id = auth.uid() and status = 'visible') with check (author_id = auth.uid() and status = 'visible');
create policy "authors delete their comments" on public.news_comments for delete using (author_id = auth.uid() or public.news_is_platform_admin());
create policy "replicas are visible with their article" on public.news_replicas for select using (exists (select 1 from public.news_articles a where a.id = article_id and a.status = 'published') or requested_by = auth.uid() or public.news_is_platform_admin());
create policy "verified professionals request replicas" on public.news_replicas for insert with check (requested_by = auth.uid() and public.has_verified_professional_profile());
create policy "platform admins decide replicas" on public.news_replicas for update using (public.news_is_platform_admin()) with check (public.news_is_platform_admin());
create policy "active ads and slots are readable" on public.news_ad_slots for select using (is_enabled or public.news_is_platform_admin());
create policy "platform admins manage ad slots" on public.news_ad_slots for all using (public.news_is_platform_admin()) with check (public.news_is_platform_admin());
create policy "active ads are readable" on public.news_ads for select using (status = 'active' or public.news_is_platform_admin());
create policy "platform admins manage ads" on public.news_ads for all using (public.news_is_platform_admin()) with check (public.news_is_platform_admin());
create policy "settings are readable" on public.news_module_settings for select using (true);
create policy "platform admins manage news settings" on public.news_module_settings for update using (public.news_is_platform_admin()) with check (public.news_is_platform_admin());

-- Realtime is reserved for user-visible comments and reactions. Articles are
-- ordinary database rows; no separate pub/sub path is needed.
alter publication supabase_realtime add table public.news_comments;
alter publication supabase_realtime add table public.news_reactions;

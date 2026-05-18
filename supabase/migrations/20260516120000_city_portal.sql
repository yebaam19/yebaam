-- City Portal — Phase 0 schema
-- Drops the legacy empty `cities` + `city_categories` tables and rebuilds the schema
-- for the new "Portal de la Ciudad" feature: a 16-feature city portal with public
-- read access, follower/photo/video/publication counter triggers, RLS that grants
-- `anon` for publicly-visible rows, and a city-admin helper that mirrors
-- `is_community_admin()`.
--
-- Mirrors the `communities` blueprint (counter triggers, is_*_admin function,
-- recompute_*_counts RPC). Seeds 6 countries (CO, MX, AR, PE, CL, EC) and 8
-- Latin American cities, with Popayán + Bogotá flagged as `is_featured`.

----------------------------------------------------------------------
-- 0. Drop legacy empty tables (verified rows=0 before this migration)
----------------------------------------------------------------------
drop table if exists public.cities cascade;
drop table if exists public.city_categories cascade;

----------------------------------------------------------------------
-- 1. countries lookup
----------------------------------------------------------------------
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.countries enable row level security;

drop policy if exists "countries_anon_read" on public.countries;
create policy "countries_anon_read" on public.countries
  for select to anon, authenticated using (true);

insert into public.countries (code, name) values
  ('CO','Colombia'),
  ('MX','México'),
  ('AR','Argentina'),
  ('PE','Perú'),
  ('CL','Chile'),
  ('EC','Ecuador')
on conflict (code) do nothing;

----------------------------------------------------------------------
-- 2. cities (new shape)
----------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  state_id uuid references public.states(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  description text not null default '',
  history_md text not null default '',
  economy_md text not null default '',
  cover_cf_image_id text,
  logo_cf_image_id text,
  is_featured boolean not null default false,
  follower_count int not null default 0,
  photo_count int not null default 0,
  video_count int not null default 0,
  post_count int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cities_slug_idx on public.cities(slug);
create index cities_country_state_idx on public.cities(country_id, state_id);
create index cities_country_id_idx on public.cities(country_id);
create index cities_state_id_idx on public.cities(state_id);
create index cities_created_by_idx on public.cities(created_by);
create index cities_featured_idx on public.cities(is_featured) where is_featured;

alter table public.cities enable row level security;

drop policy if exists "cities_anon_read" on public.cities;
create policy "cities_anon_read" on public.cities
  for select to anon, authenticated using (true);

drop policy if exists "cities_admin_insert" on public.cities;
create policy "cities_admin_insert" on public.cities
  for insert to authenticated
  with check (exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())));

drop policy if exists "cities_admin_delete" on public.cities;
create policy "cities_admin_delete" on public.cities
  for delete to authenticated
  using (exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())));

-- cities_admin_update is created after section 4 below, once is_city_admin() exists.

----------------------------------------------------------------------
-- 3. city_admins (must come before is_city_admin which references it)
----------------------------------------------------------------------
create table public.city_admins (
  city_id uuid not null references public.cities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','franchise','contractor')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  primary key (city_id, user_id)
);
create index city_admins_user_id_idx on public.city_admins(user_id);
create index city_admins_granted_by_idx on public.city_admins(granted_by);

alter table public.city_admins enable row level security;

drop policy if exists "city_admins_public_read" on public.city_admins;
create policy "city_admins_public_read" on public.city_admins
  for select to anon, authenticated using (true);

-- Split write policies (INSERT / UPDATE / DELETE) so SELECT is governed only
-- by the public read policy above. A single `FOR ALL` policy was previously
-- used here, but Supabase's advisor flagged it as overlapping with the
-- public read policy for SELECT (multiple_permissive_policies).
drop policy if exists "city_admins_platform_write" on public.city_admins;

drop policy if exists "city_admins_platform_insert" on public.city_admins;
create policy "city_admins_platform_insert" on public.city_admins
  for insert to authenticated
  with check (exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())));

drop policy if exists "city_admins_platform_update" on public.city_admins;
create policy "city_admins_platform_update" on public.city_admins
  for update to authenticated
  using (exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())));

drop policy if exists "city_admins_platform_delete" on public.city_admins;
create policy "city_admins_platform_delete" on public.city_admins
  for delete to authenticated
  using (exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid())));

----------------------------------------------------------------------
-- 4. Helper: is_city_admin (mirrors is_community_admin)
----------------------------------------------------------------------
create or replace function public.is_city_admin(p_city_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.city_admins where city_id = p_city_id and user_id = p_user_id
  ) or exists (
    select 1 from public.platform_admins where user_id = p_user_id
  );
$$;

-- Now that is_city_admin() and city_admins exist, attach the cities UPDATE policy.
drop policy if exists "cities_admin_update" on public.cities;
create policy "cities_admin_update" on public.cities
  for update to authenticated
  using (public.is_city_admin(id, (select auth.uid())))
  with check (public.is_city_admin(id, (select auth.uid())));

----------------------------------------------------------------------
-- 5. city_followers
----------------------------------------------------------------------
create table public.city_followers (
  city_id uuid not null references public.cities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (city_id, user_id)
);
create index city_followers_user_id_idx on public.city_followers(user_id);

alter table public.city_followers enable row level security;

drop policy if exists "city_followers_anon_read" on public.city_followers;
create policy "city_followers_anon_read" on public.city_followers
  for select to anon, authenticated using (true);

drop policy if exists "city_followers_self_insert" on public.city_followers;
create policy "city_followers_self_insert" on public.city_followers
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "city_followers_self_delete" on public.city_followers;
create policy "city_followers_self_delete" on public.city_followers
  for delete to authenticated using (user_id = (select auth.uid()));

----------------------------------------------------------------------
-- 6. city_news
----------------------------------------------------------------------
create table public.city_news (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  body_md text not null,
  cover_cf_image_id text,
  source_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index city_news_city_status_idx on public.city_news(city_id, status, published_at desc);
create index city_news_author_id_idx on public.city_news(author_id);

alter table public.city_news enable row level security;

drop policy if exists "city_news_public_read_approved" on public.city_news;
create policy "city_news_public_read_approved" on public.city_news
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "city_news_admin_read_all" on public.city_news;
create policy "city_news_admin_read_all" on public.city_news
  for select to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_news_author_read_own" on public.city_news;
create policy "city_news_author_read_own" on public.city_news
  for select to authenticated using (author_id = (select auth.uid()));

drop policy if exists "city_news_author_insert" on public.city_news;
create policy "city_news_author_insert" on public.city_news
  for insert to authenticated with check (author_id = (select auth.uid()));

drop policy if exists "city_news_admin_update" on public.city_news;
create policy "city_news_admin_update" on public.city_news
  for update to authenticated
  using (public.is_city_admin(city_id, (select auth.uid())))
  with check (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_news_admin_delete" on public.city_news;
create policy "city_news_admin_delete" on public.city_news
  for delete to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 7. city_promotions
----------------------------------------------------------------------
create table public.city_promotions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  body text,
  cover_cf_image_id text,
  duration text not null check (duration in ('1d','2d','3d','1w','2w','1m')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active','expired','removed')),
  created_at timestamptz not null default now()
);
create index city_promotions_city_active_idx on public.city_promotions(city_id, status, expires_at);
create index city_promotions_business_id_idx on public.city_promotions(business_id);
create index city_promotions_author_id_idx on public.city_promotions(author_id);

alter table public.city_promotions enable row level security;

drop policy if exists "city_promotions_public_read_active" on public.city_promotions;
create policy "city_promotions_public_read_active" on public.city_promotions
  for select to anon, authenticated
  using (status = 'active' and expires_at > now());

drop policy if exists "city_promotions_admin_read_all" on public.city_promotions;
create policy "city_promotions_admin_read_all" on public.city_promotions
  for select to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_promotions_author_read_own" on public.city_promotions;
create policy "city_promotions_author_read_own" on public.city_promotions
  for select to authenticated using (author_id = (select auth.uid()));

drop policy if exists "city_promotions_author_insert" on public.city_promotions;
create policy "city_promotions_author_insert" on public.city_promotions
  for insert to authenticated with check (author_id = (select auth.uid()));

drop policy if exists "city_promotions_author_update" on public.city_promotions;
create policy "city_promotions_author_update" on public.city_promotions
  for update to authenticated
  using (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())))
  with check (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_promotions_admin_delete" on public.city_promotions;
create policy "city_promotions_admin_delete" on public.city_promotions
  for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 8. city_classifieds
----------------------------------------------------------------------
create table public.city_classifieds (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  price_cents int,
  currency text not null default 'COP',
  kind text not null check (kind in ('offer','want','trade','free')),
  cf_image_ids text[] not null default '{}',
  status text not null default 'open' check (status in ('open','sold','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index city_classifieds_city_status_idx on public.city_classifieds(city_id, status, created_at desc);
create index city_classifieds_author_id_idx on public.city_classifieds(author_id);

alter table public.city_classifieds enable row level security;

drop policy if exists "city_classifieds_public_read" on public.city_classifieds;
create policy "city_classifieds_public_read" on public.city_classifieds
  for select to anon, authenticated using (true);

drop policy if exists "city_classifieds_author_insert" on public.city_classifieds;
create policy "city_classifieds_author_insert" on public.city_classifieds
  for insert to authenticated with check (author_id = (select auth.uid()));

drop policy if exists "city_classifieds_author_update" on public.city_classifieds;
create policy "city_classifieds_author_update" on public.city_classifieds
  for update to authenticated
  using (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())))
  with check (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_classifieds_author_delete" on public.city_classifieds;
create policy "city_classifieds_author_delete" on public.city_classifieds
  for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 9. city_social_help
----------------------------------------------------------------------
create table public.city_social_help (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  kind text not null check (kind in ('offer','need')),
  status text not null default 'open' check (status in ('open','closed')),
  cf_image_id text,
  created_at timestamptz not null default now()
);
create index city_social_help_city_status_idx on public.city_social_help(city_id, status, created_at desc);
create index city_social_help_author_id_idx on public.city_social_help(author_id);

alter table public.city_social_help enable row level security;

drop policy if exists "city_social_help_public_read" on public.city_social_help;
create policy "city_social_help_public_read" on public.city_social_help
  for select to anon, authenticated using (true);

drop policy if exists "city_social_help_author_insert" on public.city_social_help;
create policy "city_social_help_author_insert" on public.city_social_help
  for insert to authenticated with check (author_id = (select auth.uid()));

drop policy if exists "city_social_help_author_update" on public.city_social_help;
create policy "city_social_help_author_update" on public.city_social_help
  for update to authenticated
  using (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())))
  with check (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_social_help_author_delete" on public.city_social_help;
create policy "city_social_help_author_delete" on public.city_social_help
  for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 10. city_complaints (denuncias)
----------------------------------------------------------------------
create table public.city_complaints (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  cf_image_ids text[] not null default '{}',
  category text,
  status text not null default 'new' check (status in ('new','seen','resolved','rejected')),
  created_at timestamptz not null default now()
);
create index city_complaints_city_status_idx on public.city_complaints(city_id, status, created_at desc);
create index city_complaints_reporter_id_idx on public.city_complaints(reporter_id);

alter table public.city_complaints enable row level security;

drop policy if exists "city_complaints_reporter_read_own" on public.city_complaints;
create policy "city_complaints_reporter_read_own" on public.city_complaints
  for select to authenticated using (reporter_id = (select auth.uid()));

drop policy if exists "city_complaints_admin_read_all" on public.city_complaints;
create policy "city_complaints_admin_read_all" on public.city_complaints
  for select to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_complaints_reporter_insert" on public.city_complaints;
create policy "city_complaints_reporter_insert" on public.city_complaints
  for insert to authenticated with check (reporter_id = (select auth.uid()));

drop policy if exists "city_complaints_admin_update" on public.city_complaints;
create policy "city_complaints_admin_update" on public.city_complaints
  for update to authenticated
  using (public.is_city_admin(city_id, (select auth.uid())))
  with check (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_complaints_admin_delete" on public.city_complaints;
create policy "city_complaints_admin_delete" on public.city_complaints
  for delete to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 11. city_places (Sitios de interés)
----------------------------------------------------------------------
create table public.city_places (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  description text,
  cf_image_id text,
  category text,
  latitude double precision,
  longitude double precision,
  address text,
  created_at timestamptz not null default now()
);
create index city_places_city_idx on public.city_places(city_id, category);

alter table public.city_places enable row level security;

drop policy if exists "city_places_public_read" on public.city_places;
create policy "city_places_public_read" on public.city_places
  for select to anon, authenticated using (true);

drop policy if exists "city_places_admin_insert" on public.city_places;
create policy "city_places_admin_insert" on public.city_places
  for insert to authenticated
  with check (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_places_admin_update" on public.city_places;
create policy "city_places_admin_update" on public.city_places
  for update to authenticated
  using (public.is_city_admin(city_id, (select auth.uid())))
  with check (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_places_admin_delete" on public.city_places;
create policy "city_places_admin_delete" on public.city_places
  for delete to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 12. city_publications (publicaciones importantes)
----------------------------------------------------------------------
create table public.city_publications (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  cf_media jsonb not null default '[]'::jsonb,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index city_publications_city_idx on public.city_publications(city_id, is_pinned desc, created_at desc);
create index city_publications_author_id_idx on public.city_publications(author_id);

alter table public.city_publications enable row level security;

drop policy if exists "city_publications_public_read" on public.city_publications;
create policy "city_publications_public_read" on public.city_publications
  for select to anon, authenticated using (true);

drop policy if exists "city_publications_admin_insert" on public.city_publications;
create policy "city_publications_admin_insert" on public.city_publications
  for insert to authenticated
  with check (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_publications_admin_update" on public.city_publications;
create policy "city_publications_admin_update" on public.city_publications
  for update to authenticated
  using (public.is_city_admin(city_id, (select auth.uid())))
  with check (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_publications_admin_delete" on public.city_publications;
create policy "city_publications_admin_delete" on public.city_publications
  for delete to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 13. city_photos
----------------------------------------------------------------------
create table public.city_photos (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  uploader_id uuid references auth.users(id) on delete set null,
  cf_image_id text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index city_photos_city_idx on public.city_photos(city_id, created_at desc);
create index city_photos_uploader_id_idx on public.city_photos(uploader_id);

alter table public.city_photos enable row level security;

drop policy if exists "city_photos_public_read" on public.city_photos;
create policy "city_photos_public_read" on public.city_photos
  for select to anon, authenticated using (true);

drop policy if exists "city_photos_uploader_insert" on public.city_photos;
create policy "city_photos_uploader_insert" on public.city_photos
  for insert to authenticated with check (uploader_id = (select auth.uid()));

drop policy if exists "city_photos_uploader_delete" on public.city_photos;
create policy "city_photos_uploader_delete" on public.city_photos
  for delete to authenticated
  using (uploader_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 14. city_videos
----------------------------------------------------------------------
create table public.city_videos (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  uploader_id uuid references auth.users(id) on delete set null,
  cf_video_uid text not null,
  cf_thumbnail_id text,
  caption text,
  created_at timestamptz not null default now()
);
create index city_videos_city_idx on public.city_videos(city_id, created_at desc);
create index city_videos_uploader_id_idx on public.city_videos(uploader_id);

alter table public.city_videos enable row level security;

drop policy if exists "city_videos_public_read" on public.city_videos;
create policy "city_videos_public_read" on public.city_videos
  for select to anon, authenticated using (true);

drop policy if exists "city_videos_uploader_insert" on public.city_videos;
create policy "city_videos_uploader_insert" on public.city_videos
  for insert to authenticated with check (uploader_id = (select auth.uid()));

drop policy if exists "city_videos_uploader_delete" on public.city_videos;
create policy "city_videos_uploader_delete" on public.city_videos
  for delete to authenticated
  using (uploader_id = (select auth.uid()) or public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 15. city_contact_messages
----------------------------------------------------------------------
create table public.city_contact_messages (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  subject text,
  body text not null,
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);
create index city_contact_messages_city_status_idx on public.city_contact_messages(city_id, status, created_at desc);
create index city_contact_messages_sender_id_idx on public.city_contact_messages(sender_id);

alter table public.city_contact_messages enable row level security;

drop policy if exists "city_contact_messages_sender_read_own" on public.city_contact_messages;
create policy "city_contact_messages_sender_read_own" on public.city_contact_messages
  for select to authenticated using (sender_id = (select auth.uid()));

drop policy if exists "city_contact_messages_admin_read_all" on public.city_contact_messages;
create policy "city_contact_messages_admin_read_all" on public.city_contact_messages
  for select to authenticated using (public.is_city_admin(city_id, (select auth.uid())));

drop policy if exists "city_contact_messages_sender_insert" on public.city_contact_messages;
create policy "city_contact_messages_sender_insert" on public.city_contact_messages
  for insert to authenticated with check (sender_id = (select auth.uid()));

drop policy if exists "city_contact_messages_admin_update" on public.city_contact_messages;
create policy "city_contact_messages_admin_update" on public.city_contact_messages
  for update to authenticated
  using (public.is_city_admin(city_id, (select auth.uid())))
  with check (public.is_city_admin(city_id, (select auth.uid())));

----------------------------------------------------------------------
-- 16. recompute_city_counts RPC
----------------------------------------------------------------------
create or replace function public.recompute_city_counts(p_city_id uuid)
returns void
language sql
security definer
set search_path = 'public'
as $$
  update public.cities c
     set follower_count = (select count(*) from public.city_followers where city_id = c.id),
         photo_count    = (select count(*) from public.city_photos where city_id = c.id),
         video_count    = (select count(*) from public.city_videos where city_id = c.id),
         post_count     = (select count(*) from public.city_publications where city_id = c.id)
   where c.id = p_city_id;
$$;

----------------------------------------------------------------------
-- 17. Counter trigger functions (mirror tg_community_*_counter)
----------------------------------------------------------------------
create or replace function public.tg_city_follower_counter()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if tg_op = 'INSERT' then
    update public.cities
       set follower_count = follower_count + 1
     where id = new.city_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cities
       set follower_count = greatest(0, follower_count - 1)
     where id = old.city_id;
    return old;
  end if;
  return null;
end $$;

create or replace function public.tg_city_photo_counter()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if tg_op = 'INSERT' then
    update public.cities
       set photo_count = photo_count + 1
     where id = new.city_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cities
       set photo_count = greatest(0, photo_count - 1)
     where id = old.city_id;
    return old;
  end if;
  return null;
end $$;

create or replace function public.tg_city_video_counter()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if tg_op = 'INSERT' then
    update public.cities
       set video_count = video_count + 1
     where id = new.city_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cities
       set video_count = greatest(0, video_count - 1)
     where id = old.city_id;
    return old;
  end if;
  return null;
end $$;

create or replace function public.tg_city_publication_counter()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if tg_op = 'INSERT' then
    update public.cities
       set post_count = post_count + 1
     where id = new.city_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cities
       set post_count = greatest(0, post_count - 1)
     where id = old.city_id;
    return old;
  end if;
  return null;
end $$;

----------------------------------------------------------------------
-- 18. Trigger bindings
----------------------------------------------------------------------
drop trigger if exists tg_city_follower_counter on public.city_followers;
create trigger tg_city_follower_counter
  after insert or delete on public.city_followers
  for each row execute function public.tg_city_follower_counter();

drop trigger if exists tg_city_photo_counter on public.city_photos;
create trigger tg_city_photo_counter
  after insert or delete on public.city_photos
  for each row execute function public.tg_city_photo_counter();

drop trigger if exists tg_city_video_counter on public.city_videos;
create trigger tg_city_video_counter
  after insert or delete on public.city_videos
  for each row execute function public.tg_city_video_counter();

drop trigger if exists tg_city_publication_counter on public.city_publications;
create trigger tg_city_publication_counter
  after insert or delete on public.city_publications
  for each row execute function public.tg_city_publication_counter();

-- updated_at maintenance (reuses pre-existing public.tg_set_updated_at)
drop trigger if exists tg_set_updated_at on public.cities;
create trigger tg_set_updated_at
  before update on public.cities
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_set_updated_at on public.city_news;
create trigger tg_set_updated_at
  before update on public.city_news
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_set_updated_at on public.city_classifieds;
create trigger tg_set_updated_at
  before update on public.city_classifieds
  for each row execute function public.tg_set_updated_at();

----------------------------------------------------------------------
-- 19. Realtime publication membership
----------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.city_publications;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.city_news;
  exception when duplicate_object then null;
  end;
end $$;

----------------------------------------------------------------------
-- 20. Seed 8 Latin American cities
----------------------------------------------------------------------
insert into public.cities (name, slug, country_id, description, history_md, economy_md, is_featured) values
(
  'Popayán',
  'popayan',
  (select id from public.countries where code = 'CO'),
  'Conocida como la Ciudad Blanca, capital del departamento del Cauca y joya colonial del suroccidente colombiano.',
  E'Popayán fue fundada el 13 de enero de 1537 por el conquistador español Sebastián de Belalcázar, convirtiéndose rápidamente en uno de los centros administrativos, religiosos y culturales más importantes del Virreinato del Perú y luego del Virreinato de Nueva Granada.\n\nDurante los siglos XVII y XVIII, la ciudad se consolidó como sede de obispado y como núcleo de la aristocracia criolla, lo que dejó un legado arquitectónico extraordinario en su centro histórico, que conserva iglesias, conventos y casonas de cal y canto.\n\nEn el siglo XIX, Popayán dio al país varios presidentes y poetas, y sus procesiones de Semana Santa, declaradas Patrimonio Inmaterial de la Humanidad por la UNESCO en 2009, mantienen viva una tradición religiosa de más de cuatro siglos.',
  E'La economía de Popayán se sostiene en gran medida en el sector servicios: educación superior con universidades como la Universidad del Cauca, salud, comercio y turismo cultural.\n\nLa gastronomía local —reconocida por la UNESCO como Ciudad Creativa de la Gastronomía— y el turismo religioso atraen visitantes durante todo el año, especialmente en Semana Santa.\n\nAlrededor del valle de Pubenza, la actividad agropecuaria (café, panela, lácteos) y la producción artesanal complementan el tejido productivo de la ciudad.',
  true
),
(
  'Bogotá',
  'bogota',
  (select id from public.countries where code = 'CO'),
  'Capital de Colombia y centro político, económico y cultural del país, ubicada en el altiplano cundiboyacense.',
  E'Santa Fe de Bogotá fue fundada el 6 de agosto de 1538 por Gonzalo Jiménez de Quesada sobre el territorio de los muiscas, en lo que entonces se denominó el Nuevo Reino de Granada.\n\nDesde el siglo XVI fue sede de la Real Audiencia y, más tarde, capital del Virreinato de Nueva Granada, lo que la convirtió en un centro de poder colonial y luego en la cuna del movimiento independentista de 1810.\n\nA lo largo del siglo XX, Bogotá creció exponencialmente con la llegada de migrantes de todo el país, transformándose en una metrópoli de más de ocho millones de habitantes con un casco histórico —La Candelaria— rico en patrimonio.',
  E'Bogotá concentra cerca de un cuarto del producto interno bruto colombiano y alberga las sedes principales de los grandes bancos, aseguradoras y compañías nacionales e internacionales.\n\nLos sectores predominantes son los servicios financieros, las telecomunicaciones, el comercio mayorista, la industria manufacturera ligera y un creciente ecosistema de tecnología y emprendimiento.\n\nLa ciudad también funciona como centro logístico del país por su aeropuerto El Dorado, uno de los más activos de América Latina en carga y pasajeros.',
  true
),
(
  'Medellín',
  'medellin',
  (select id from public.countries where code = 'CO'),
  'Capital del departamento de Antioquia, conocida como la Ciudad de la Eterna Primavera y referente de innovación urbana.',
  E'Medellín fue fundada formalmente el 2 de noviembre de 1675, aunque sus orígenes se remontan a poblamientos previos en el valle de Aburrá. Durante el siglo XIX se consolidó como centro de la economía cafetera y minera de Antioquia.\n\nEn el siglo XX la ciudad experimentó un acelerado proceso de industrialización, convirtiéndose en uno de los polos textiles y manufactureros más importantes de Sudamérica.\n\nTras superar la difícil década de los ochenta y noventa, Medellín se reinventó como referente mundial de transformación urbana, con proyectos de movilidad, cultura y educación que la hicieron acreedora a numerosos reconocimientos internacionales.',
  E'La economía de Medellín se diversifica entre la industria manufacturera (textiles, confecciones, metalmecánica), los servicios financieros, la energía, las telecomunicaciones y un dinámico sector de tecnología.\n\nGrandes empresas como Empresas Públicas de Medellín, Bancolombia y Grupo Nutresa tienen aquí su sede principal, y el ecosistema de startups del Valle del Software emplea a miles de profesionales.\n\nEl turismo médico, de negocios y cultural también ha cobrado peso en los últimos años, impulsado por la conectividad aérea y la oferta hotelera.',
  false
),
(
  'Cali',
  'cali',
  (select id from public.countries where code = 'CO'),
  'Capital del departamento del Valle del Cauca, llamada la Sucursal del Cielo y reconocida mundialmente como capital de la salsa.',
  E'Santiago de Cali fue fundada el 25 de julio de 1536 por Sebastián de Belalcázar, lo que la convierte en una de las ciudades más antiguas de América continental.\n\nDurante la Colonia fue paso obligado entre Quito y Popayán y centro agrícola de la región. En el siglo XIX se consolidó como capital del Valle del Cauca y a mediados del siglo XX vivió una expansión vertiginosa con la industrialización del valle azucarero.\n\nA lo largo del siglo XX se convirtió en referente cultural por su música, especialmente la salsa, que adoptó como sello identitario y exportó a través de orquestas, bailarines y festivales de talla internacional.',
  E'La economía caleña gira en torno a la agroindustria azucarera del valle, la industria manufacturera (papel, química, alimentos), el comercio y los servicios.\n\nEl puerto de Buenaventura, en el mismo departamento, es la principal salida del país al océano Pacífico y eje logístico de las exportaciones e importaciones de Cali y su zona de influencia.\n\nEl sector cultural y de espectáculos —impulsado por la salsa— y el turismo de eventos completan un tejido productivo diverso.',
  false
),
(
  'Ciudad de México',
  'ciudad-de-mexico',
  (select id from public.countries where code = 'MX'),
  'Capital de los Estados Unidos Mexicanos y una de las metrópolis más pobladas del mundo, con un legado precolombino, colonial y moderno excepcional.',
  E'La Ciudad de México hunde sus raíces en México-Tenochtitlán, capital del Imperio Mexica fundada hacia 1325 sobre un islote del lago de Texcoco. Tras la caída de Tenochtitlán en 1521, Hernán Cortés ordenó construir sobre sus ruinas la capital del Virreinato de Nueva España.\n\nDurante tres siglos coloniales, la ciudad creció como centro político, religioso y económico del virreinato más importante de Hispanoamérica, dejando un patrimonio monumental que se conserva en el Centro Histórico, declarado Patrimonio de la Humanidad por la UNESCO.\n\nEn el siglo XX la ciudad vivió una explosión demográfica que la convirtió en una megalópolis de más de veinte millones de habitantes en su área metropolitana, con una vida cultural, gastronómica y artística de proyección mundial.',
  E'La Ciudad de México concentra cerca del 17% del PIB nacional y es la mayor economía urbana de México y una de las más grandes de América Latina.\n\nLos sectores predominantes son los servicios financieros, el comercio, las telecomunicaciones, los servicios profesionales, la manufactura ligera y un creciente sector creativo y tecnológico.\n\nLa ciudad también es sede de las principales corporaciones nacionales y de las filiales latinoamericanas de muchas multinacionales, además de ser un nodo turístico, cultural y gastronómico de primer nivel.',
  false
),
(
  'Buenos Aires',
  'buenos-aires',
  (select id from public.countries where code = 'AR'),
  'Capital de la República Argentina, conocida como la París de Sudamérica por su arquitectura europea y su intensa vida cultural.',
  E'Buenos Aires fue fundada dos veces: la primera en 1536 por Pedro de Mendoza, fundación efímera abandonada por los conflictos con los pueblos originarios; y la segunda en 1580 por Juan de Garay, esta vez de manera definitiva.\n\nDurante los siglos XVIII y XIX la ciudad creció como puerto del Atlántico Sur y se consolidó, tras la independencia, como capital nacional y eje del modelo agroexportador argentino.\n\nEntre 1880 y 1930 recibió una inmensa ola migratoria europea —italianos, españoles, judíos, alemanes, sirios— que transformó su paisaje urbano, su cocina y su música, dando origen al tango.',
  E'Buenos Aires concentra cerca de un tercio del PIB argentino y es la sede de las principales empresas, bancos y organismos del país.\n\nLa economía urbana se sostiene en los servicios financieros, el comercio mayorista, la industria manufacturera, los servicios profesionales y un fuerte sector cultural (editorial, audiovisual, gastronómico, teatral).\n\nEl puerto de Buenos Aires sigue siendo uno de los principales puertos del Cono Sur, y el sector turístico de la ciudad atrae millones de visitantes anuales.',
  false
),
(
  'Lima',
  'lima',
  (select id from public.countries where code = 'PE'),
  'Capital del Perú, conocida como la Ciudad de los Reyes y centro político, financiero y gastronómico del país.',
  E'Lima fue fundada el 18 de enero de 1535 por Francisco Pizarro con el nombre de Ciudad de los Reyes, en el valle del río Rímac.\n\nDurante los siglos coloniales fue capital del Virreinato del Perú, el más importante de Sudamérica, y su centro histórico todavía conserva la mayor concentración de arquitectura virreinal del subcontinente, motivo por el cual fue declarado Patrimonio de la Humanidad por la UNESCO en 1988.\n\nEn el siglo XX la ciudad creció exponencialmente con la migración del campo a la ciudad, conformando una metrópoli de cerca de diez millones de habitantes con una identidad cultural rica y plural.',
  E'Lima concentra alrededor del 45% del PIB peruano y es el principal centro financiero, comercial e industrial del país.\n\nLos sectores predominantes son los servicios financieros, el comercio, la industria manufacturera, los servicios logísticos y un creciente sector gastronómico que ha proyectado la cocina peruana al mundo.\n\nEl puerto del Callao, en el área metropolitana, es uno de los principales puertos del Pacífico sudamericano y eje logístico del comercio exterior peruano.',
  false
),
(
  'Santiago',
  'santiago',
  (select id from public.countries where code = 'CL'),
  'Capital de la República de Chile, situada al pie de la Cordillera de los Andes y centro político y económico del país.',
  E'Santiago de Nueva Extremadura fue fundada el 12 de febrero de 1541 por Pedro de Valdivia, al pie del cerro Huelén —hoy Santa Lucía— en el valle del río Mapocho.\n\nDurante la Colonia fue capital de la Capitanía General de Chile y, tras la independencia en 1818, capital de la nueva república. En el siglo XIX, con la expansión de la minería del salitre y luego del cobre, la ciudad creció en infraestructura y población.\n\nA lo largo del siglo XX, Santiago se consolidó como una de las metrópolis más modernas y mejor planificadas de Sudamérica, con un sistema de metro extenso y un centro financiero —Sanhattan— de proyección regional.',
  E'Santiago concentra cerca del 45% del PIB chileno y es el principal centro financiero, comercial y de servicios del país.\n\nLos sectores predominantes son la banca y los servicios financieros, las telecomunicaciones, el comercio minorista, la industria de servicios profesionales y un creciente sector tecnológico que ha posicionado a la ciudad como hub regional.\n\nLa minería del cobre, aunque se desarrolla principalmente en otras regiones del país, tiene sus oficinas corporativas y financieras en Santiago, lo que refuerza su rol de capital económica.',
  false
);

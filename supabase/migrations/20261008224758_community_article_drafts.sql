-- Preserve the publication state of existing articles; all future rows start private.
alter table public.community_articles add column if not exists is_published boolean not null default true;
alter table public.community_articles alter column is_published set default false;
alter table public.community_articles alter column published_at drop not null;
alter table public.community_articles alter column published_at drop default;
alter table public.community_articles add column if not exists category text not null default '';
alter table public.community_articles add column if not exists cover_asset_id uuid;
alter table public.community_articles add column if not exists attachment_ids uuid[] not null default '{}';
alter table public.community_articles add column if not exists version integer not null default 1;
alter table public.community_articles add column if not exists deleted_at timestamptz;
alter table public.community_articles add column if not exists hidden_at timestamptz;
alter table public.community_articles add column if not exists moderation_reason text not null default '';
alter table public.community_articles add column if not exists search_vector tsvector generated always as (
  to_tsvector('spanish', title || ' ' || coalesce(summary,'') || ' ' || category || ' ' || regexp_replace(content,'<[^>]*>',' ','g'))
) stored;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='community_article_cover_scope' and conrelid='public.community_articles'::regclass) then
    alter table public.community_articles add constraint community_article_cover_scope
      foreign key(community_id,cover_asset_id) references public.community_library_assets(community_id,id);
  end if;
end $$;
create index if not exists community_articles_listing_idx on public.community_articles(community_id,created_at desc,id desc) where deleted_at is null;
create index if not exists community_articles_category_idx on public.community_articles(community_id,category,created_at desc,id desc) where deleted_at is null;
create index if not exists community_articles_search_idx on public.community_articles using gin(search_vector) where deleted_at is null;
create index if not exists community_articles_cover_idx on public.community_articles(community_id,cover_asset_id);
create index if not exists community_articles_author_idx on public.community_articles(author_id);

create or replace function community_private.can_read_article(target_article uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.community_articles a where a.id=target_article
    and community_private.can_read_library(a.community_id,'public') and (
      community_private.can_manage_profile(a.community_id,'content')
      or community_private.can_manage_profile(a.community_id,'moderation')
      or (a.is_published and a.deleted_at is null and a.hidden_at is null
        and community_private.qa_author_visible(a.author_id))));
$$;
revoke all on function community_private.can_read_article(uuid) from public;
grant execute on function community_private.can_read_article(uuid) to anon,authenticated;
alter table public.community_articles enable row level security;
revoke all on public.community_articles from anon,authenticated;
grant select on public.community_articles to anon,authenticated;
drop policy if exists community_articles_select on public.community_articles;
drop policy if exists community_articles_insert on public.community_articles;
drop policy if exists community_articles_update on public.community_articles;
drop policy if exists community_articles_delete on public.community_articles;
drop policy if exists community_articles_read on public.community_articles;
create policy community_articles_read on public.community_articles for select to anon,authenticated
using (community_private.can_read_article(id));
drop trigger if exists tg_community_articles_touch_updated_at on public.community_articles;
drop trigger if exists prepare_article on public.community_articles;
create trigger prepare_article before insert or update on public.community_articles
for each row execute function community_private.prepare_qa_write();
drop trigger if exists audit_article on public.community_articles;
create trigger audit_article after insert or update on public.community_articles
for each row execute function community_private.record_plan_revision();

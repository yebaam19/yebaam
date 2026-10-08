-- Questions are private correspondence until their author explicitly publishes.
-- Official answers may only be written by current institutional content delegates.
create table if not exists public.community_question_categories (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  position integer not null default 0 check (position >= 0),
  is_published boolean not null default false,
  deleted_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id,id)
);
create index if not exists question_categories_listing_idx on public.community_question_categories(community_id,position,id) where deleted_at is null;
create table if not exists public.community_questions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  body text not null check (char_length(btrim(body)) between 1 and 6000),
  is_published boolean not null default false,
  is_closed boolean not null default false,
  is_faq boolean not null default false,
  hidden_at timestamptz,
  moderation_reason text not null default '' check (char_length(moderation_reason) <= 1000),
  deleted_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (to_tsvector('spanish',title || ' ' || body)) stored,
  unique (community_id,id),
  foreign key (community_id,category_id) references public.community_question_categories(community_id,id)
);
create index if not exists questions_listing_idx on public.community_questions(community_id,created_at desc,id desc) where deleted_at is null;
create index if not exists questions_category_idx on public.community_questions(community_id,category_id,created_at desc,id desc) where deleted_at is null;
create index if not exists questions_author_idx on public.community_questions(author_id,community_id);
create index if not exists questions_search_idx on public.community_questions using gin(search_vector) where deleted_at is null;
create table if not exists public.community_question_answers (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  question_id uuid not null,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  is_published boolean not null default false,
  hidden_at timestamptz,
  moderation_reason text not null default '' check (char_length(moderation_reason) <= 1000),
  deleted_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (community_id,question_id) references public.community_questions(community_id,id) on delete cascade
);
create index if not exists question_answers_listing_idx on public.community_question_answers(community_id,question_id,created_at,id) where deleted_at is null;
create index if not exists question_answers_author_idx on public.community_question_answers(author_id);

-- Inspect block edges internally; callers never gain access to another user's graph.
create or replace function community_private.qa_author_visible(target_author uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select not exists (select 1 from public.friendships f where f.status='blocked' and (
    (f.requester_id=(select auth.uid()) and f.recipient_id=target_author)
    or (f.recipient_id=(select auth.uid()) and f.requester_id=target_author)));
$$;
revoke all on function community_private.qa_author_visible(uuid) from public;
grant execute on function community_private.qa_author_visible(uuid) to anon,authenticated;
create or replace function community_private.can_read_question(target_question uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (select 1 from public.community_questions q where q.id=target_question
    and community_private.can_read_library(q.community_id,'public') and (
      community_private.can_manage_profile(q.community_id,'content')
      or community_private.can_manage_profile(q.community_id,'moderation')
      or (q.deleted_at is null and (q.author_id=(select auth.uid()) or (
        q.is_published and q.hidden_at is null and community_private.qa_author_visible(q.author_id)
        and (q.category_id is null or exists (select 1 from public.community_question_categories c
          where c.id=q.category_id and c.community_id=q.community_id and c.is_published and c.deleted_at is null))
      )))
    ));
$$;
revoke all on function community_private.can_read_question(uuid) from public;
grant execute on function community_private.can_read_question(uuid) to anon,authenticated;

alter table public.community_question_categories enable row level security;
alter table public.community_questions enable row level security;
alter table public.community_question_answers enable row level security;
revoke all on public.community_question_categories,public.community_questions,public.community_question_answers from anon,authenticated;
grant select on public.community_question_categories,public.community_questions,public.community_question_answers to anon,authenticated;
grant all on public.community_question_categories,public.community_questions,public.community_question_answers to service_role;
drop policy if exists question_categories_read on public.community_question_categories;
create policy question_categories_read on public.community_question_categories for select to anon,authenticated using (
  community_private.can_manage_profile(community_id,'content') or community_private.can_manage_profile(community_id,'moderation')
  or (is_published and deleted_at is null and community_private.can_read_library(community_id,'public'))
);
drop policy if exists questions_read on public.community_questions;
create policy questions_read on public.community_questions for select to anon,authenticated
using (community_private.can_read_question(id));
drop policy if exists question_answers_read on public.community_question_answers;
create policy question_answers_read on public.community_question_answers for select to anon,authenticated using (
  community_private.can_read_question(question_id) and (
    community_private.can_manage_profile(community_id,'content') or community_private.can_manage_profile(community_id,'moderation')
    or (is_published and hidden_at is null and deleted_at is null and community_private.qa_author_visible(author_id))
  )
);

create or replace function community_private.prepare_qa_write()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.id,new.community_id) is distinct from (old.id,old.community_id) then
    raise exception 'Identity is immutable' using errcode='23514';
  end if;
  new.version:=case when tg_op='INSERT' then 1 else old.version+1 end;
  new.created_at:=case when tg_op='INSERT' then now() else old.created_at end;
  new.updated_at:=now();
  return new;
end;
$$;
revoke all on function community_private.prepare_qa_write() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['community_question_categories','community_questions','community_question_answers'] loop
    execute format('drop trigger if exists prepare_qa on public.%I',t);
    execute format('create trigger prepare_qa before insert or update on public.%I for each row execute function community_private.prepare_qa_write()',t);
    execute format('drop trigger if exists audit_qa on public.%I',t);
    execute format('create trigger audit_qa after insert or update on public.%I for each row execute function community_private.record_plan_revision()',t);
  end loop;
end $$;

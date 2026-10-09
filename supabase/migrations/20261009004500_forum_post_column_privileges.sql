-- Browser writers supply only ownership, topic and content at creation.
-- The database owns sequence numbers and timestamps; edits touch body only.
revoke insert, update on public.forum_posts from authenticated;
grant insert (topic_id, author_id, content) on public.forum_posts to authenticated;
grant update (content) on public.forum_posts to authenticated;

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.forum_posts'::regclass
    and conname = 'forum_posts_content_bound') then
    alter table public.forum_posts add constraint forum_posts_content_bound
      check (char_length(btrim(content)) between 1 and 20000);
  end if;
end $$;

create or replace function public.forum_posts_set_edited_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.edited_at := now();
  return new;
end;
$$;
revoke all on function public.forum_posts_set_edited_at() from public, anon, authenticated;
drop trigger if exists forum_posts_set_edited_at on public.forum_posts;
create trigger forum_posts_set_edited_at before update of content
  on public.forum_posts for each row
  execute function public.forum_posts_set_edited_at();

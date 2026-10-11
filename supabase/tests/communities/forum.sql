-- Run with Supabase MCP execute_sql. All fixtures and role grants roll back.
begin;
do $$
<<forum_test>>
declare
  people uuid[];
  owner_id uuid;
  member_id uuid;
  community_id uuid := gen_random_uuid();
  space_id uuid := gen_random_uuid();
  category_id uuid := gen_random_uuid();
  forum_id uuid := gen_random_uuid();
  topic_id uuid := gen_random_uuid();
  post_id uuid := gen_random_uuid();
  affected integer;
  public_count bigint;
  private_count bigint;
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id
    order by u.id limit 2
  ) candidates;
  if cardinality(people)<2 then raise exception 'Two profiles required'; end if;
  owner_id:=people[1]; member_id:=people[2];

  insert into public.communities(id,owner_id,name,slug,privacy)
    values(community_id,owner_id,'Forum RLS test','forum-rls-'||community_id,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status)
    values(community_id,member_id,'MEMBER','active');
  insert into public.forum_spaces(id,owner_type,owner_id,slug,name,visibility,enabled,enabled_by)
    values(space_id,'community',community_id,'forum-rls-'||space_id,'Forum RLS test','public',true,owner_id);
  insert into public.forum_categories(id,space_id,name,slug,position)
    values(category_id,space_id,'General','general-'||space_id,0);
  insert into public.forums(id,category_id,name,slug,position)
    values(forum_id,category_id,'General','forum-rls-'||forum_id,0);
  insert into public.forum_topics(id,forum_id,author_id,title,slug)
    values(topic_id,forum_id,member_id,'Visible public topic','visible-public-topic');
  insert into public.forum_posts(id,topic_id,author_id,content,post_number)
    values(post_id,topic_id,member_id,'Public forum content',1);

  set local role anon;
  if not exists(select 1 from public.forum_spaces where id=space_id)
    or not exists(select 1 from public.forum_topics where id=topic_id)
    or not exists(select 1 from public.forum_posts where id=post_id) then
    raise exception 'Public forum was unreadable to a visitor';
  end if;
  select coalesce(post_count,0) into public_count
    from public.forum_visible_post_counts(array[member_id]) where author_id=member_id;
  if coalesce(public_count,0)<1 then
    raise exception 'Visible author post count was missing';
  end if;
  reset role;

  update public.communities set privacy='PRIVATE' where id=community_id;
  set local role anon;
  if exists(select 1 from public.forum_spaces where id=space_id)
    or exists(select 1 from public.forum_topics where id=topic_id)
    or exists(select 1 from public.forum_posts where id=post_id) then
    raise exception 'Privacy change did not hide forum content';
  end if;
  select coalesce(post_count,0) into private_count
    from public.forum_visible_post_counts(array[member_id]) where author_id=member_id;
  if coalesce(private_count,0)<>public_count-1 then
    raise exception 'Author post count leaked private forum content';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub',member_id::text,true);
  set local role authenticated;
  if not exists(select 1 from public.forum_topics where id=topic_id) then
    raise exception 'Active member cannot read private forum';
  end if;
  if not exists(select 1 from public.forum_visible_post_counts(array[member_id])
    where author_id=member_id and post_count>=public_count) then
    raise exception 'Member could not count visible private forum posts';
  end if;
  update public.forum_topics set is_pinned=true where id=topic_id;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Ordinary author pinned a topic'; end if;
  reset role;

  insert into public.community_profile_roles(community_id,user_id,role)
    values(community_id,member_id,'moderator');
  set local role authenticated;
  if not public.has_forum_role(space_id,array['admin','moderator'])
    or public.has_forum_role(space_id,array['admin']) then
    raise exception 'Community moderator role did not map to forum moderation';
  end if;
  update public.forum_topics set is_pinned=true where id=topic_id;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Moderator could not pin topic'; end if;
  reset role;

  delete from public.community_profile_roles r
    where r.community_id=forum_test.community_id and r.user_id=member_id;
  set local role authenticated;
  if public.has_forum_role(space_id,array['admin','moderator']) then
    raise exception 'Revoked moderator kept forum privileges';
  end if;
end;
$$;
rollback;

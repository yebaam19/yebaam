-- Run with Supabase MCP execute_sql. The fixtures and moderation delete roll back.
begin;
do $$
declare people uuid[]; owner_id uuid; member_id uuid; outsider_id uuid;
  org uuid:=gen_random_uuid(); space uuid:=gen_random_uuid(); cat uuid:=gen_random_uuid();
  forum uuid:=gen_random_uuid(); topic uuid:=gen_random_uuid(); post uuid:=gen_random_uuid();
  report_id uuid; duplicate_id uuid; moderator_report uuid;
begin
  select array_agg(id) into people from (
    select u.id from auth.users u join public.profiles p on p.id=u.id order by u.id limit 3
  ) candidates;
  if cardinality(people)<3 then raise exception 'Three profiles required'; end if;
  owner_id:=people[1]; member_id:=people[2]; outsider_id:=people[3];
  insert into public.communities(id,owner_id,name,slug,privacy)
    values(org,owner_id,'Forum reports rollback','forum-reports-'||org,'PUBLIC');
  insert into public.community_members(community_id,user_id,role,status)
    values(org,member_id,'MEMBER','active');
  insert into public.forum_spaces(id,owner_type,owner_id,slug,name,visibility,enabled,enabled_by)
    values(space,'community',org,'forum-reports-'||space,'Forum reports','public',true,owner_id);
  insert into public.forum_categories(id,space_id,name,slug,position)
    values(cat,space,'General','general-'||space,0);
  insert into public.forums(id,category_id,name,slug,position)
    values(forum,cat,'General','forum-reports-'||forum,0);
  insert into public.forum_topics(id,forum_id,author_id,title,slug)
    values(topic,forum,member_id,'Reported topic','reported-topic');
  insert into public.forum_posts(id,topic_id,author_id,content,post_number)
    values(post,topic,member_id,'Reported post content',1);

  perform set_config('request.jwt.claim.sub','',true); set local role anon;
  begin
    perform public.report_community_forum_post(post,'Anonymous report reason');
    raise exception 'Anonymous reporter accepted';
  exception when insufficient_privilege then null; end;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub',outsider_id::text,true);
  report_id:=public.report_community_forum_post(post,'Public visitor report');
  duplicate_id:=public.report_community_forum_post(post,'Public visitor report');
  if report_id is null or report_id<>duplicate_id then raise exception 'Report retry duplicated'; end if;
  if exists(select 1 from public.community_forum_reports where id=report_id) then
    raise exception 'Private report leaked to reporter';
  end if;
  begin
    insert into public.community_forum_reports
      (community_id,post_id,topic_id,reporter_id,reason,post_snapshot,topic_title)
      values(org,post,topic,outsider_id,'Forged report','Forged','Forged');
    raise exception 'Direct report insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.review_community_forum_report(report_id,'remove','Unauthorized removal');
    raise exception 'Outsider resolved report';
  exception when insufficient_privilege then null; end;
  reset role; update public.communities set privacy='PRIVATE' where id=org;
  set local role authenticated;
  begin
    perform public.report_community_forum_post(post,'Private report attempt');
    raise exception 'Private forum report accepted from outsider';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  if not exists(select 1 from public.community_forum_reports where id=report_id) then
    raise exception 'Owner cannot read report';
  end if;
  perform public.review_community_forum_report(report_id,'dismiss','Report does not violate rules');
  if not exists(select 1 from public.community_forum_reports where id=report_id and status='dismissed') then
    raise exception 'Dismissal not recorded';
  end if;
  reset role;
  insert into public.community_profile_roles(community_id,user_id,role)
    values(org,member_id,'moderator');
  set local role authenticated;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  moderator_report:=public.report_community_forum_post(post,'Moderator test report');
  if not exists(select 1 from public.community_forum_reports where id=moderator_report) then
    raise exception 'Moderator cannot read queue';
  end if;
  perform public.review_community_forum_report(moderator_report,'remove','Post violates community rules');
  if exists(select 1 from public.forum_posts where id=post) then raise exception 'Reported post remained'; end if;
  if not exists(select 1 from public.community_forum_reports
    where id=moderator_report and status='resolved' and post_snapshot='Reported post content'
      and post_author_id=member_id) then
    raise exception 'Private moderation evidence lost';
  end if;
  reset role;
  if not exists(select 1 from pg_constraint where conrelid='public.community_forum_reports'::regclass
    and conname='community_forum_reports_reporter_id_fkey' and confdeltype='c') then
    raise exception 'Reporter account deletion does not erase report';
  end if;
  update public.community_forum_reports set post_author_id=null where id=moderator_report;
  set local role authenticated;
  if not exists(select 1 from public.community_forum_reports where id=moderator_report
    and post_snapshot='Contenido eliminado con la cuenta'
    and topic_title='Tema eliminado con la cuenta'
    and reason='Reporte anonimizado por eliminación de cuenta' and reviewer_note='') then
    raise exception 'Author account deletion left report content';
  end if;
end;
$$;
rollback;

create or replace function community_private.save_question(
  target_community uuid, target_id uuid, expected_version integer,
  question_title text, question_body text, target_category uuid, published boolean
) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.community_questions; saved public.community_questions; caller uuid:=auth.uid();
begin
  if caller is null or not community_private.can_read_library(target_community,'public') then
    raise exception 'Not allowed' using errcode='42501';
  end if;
  if expected_version is null or expected_version<0 or published is null then
    raise exception 'Invalid input' using errcode='23514';
  end if;
  -- Stable author lock bounds creation bursts and makes concurrent retries idempotent.
  perform pg_advisory_xact_lock(hashtextextended('community-question:'||caller::text,0));
  select * into q from public.community_questions where id=target_id for update;
  if found and (q.community_id<>target_community or q.author_id<>caller or q.deleted_at is not null
    or q.hidden_at is not null or q.is_closed) then raise exception 'Not allowed' using errcode='42501'; end if;
  if target_category is not null then
    perform 1 from public.community_question_categories c where c.id=target_category and c.community_id=target_community
      and c.deleted_at is null and (c.is_published or community_private.can_manage_profile(target_community,'content')) for share;
    if not found then raise exception 'Category unavailable' using errcode='23514'; end if;
  end if;
  if q.id is not null and (q.title,q.body,q.category_id,q.is_published)
    is not distinct from (btrim(question_title),btrim(question_body),target_category,published) then
    return jsonb_build_object('id',q.id,'version',q.version);
  end if;
  if (q.id is null and expected_version<>0) or (q.id is not null and q.version<>expected_version) then
    raise exception 'Version conflict' using errcode='40001';
  end if;
  if q.id is null then
    if (select count(*) from public.community_questions where author_id=caller and created_at>now()-interval '1 hour')>=30 then
      raise exception 'Question rate limit' using errcode='54000';
    end if;
    insert into public.community_questions(id,community_id,author_id,title,body,category_id,is_published)
      values(target_id,target_community,caller,btrim(question_title),btrim(question_body),target_category,published) returning * into saved;
  else
    update public.community_questions set title=btrim(question_title),body=btrim(question_body),category_id=target_category,
      is_published=published,is_faq=case when published then is_faq else false end where id=q.id returning * into saved;
  end if;
  return jsonb_build_object('id',saved.id,'version',saved.version);
end;
$$;
revoke all on function community_private.save_question(uuid,uuid,integer,text,text,uuid,boolean) from public,anon;
grant execute on function community_private.save_question(uuid,uuid,integer,text,text,uuid,boolean) to authenticated;
create or replace function public.save_community_question(target_community uuid,target_id uuid,expected_version integer,question_title text,question_body text,target_category uuid,published boolean)
returns jsonb language sql security invoker set search_path='' as $$
  select community_private.save_question(target_community,target_id,expected_version,question_title,question_body,target_category,published);
$$;
revoke all on function public.save_community_question(uuid,uuid,integer,text,text,uuid,boolean) from public,anon;
grant execute on function public.save_community_question(uuid,uuid,integer,text,text,uuid,boolean) to authenticated;

create or replace function community_private.save_question_answer(
  target_community uuid,target_question uuid,target_id uuid,expected_version integer,answer_body text,published boolean
) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.community_questions; a public.community_question_answers; saved public.community_question_answers;
begin
  if auth.uid() is null or not community_private.can_manage_profile(target_community,'content') then
    raise exception 'Not allowed' using errcode='42501';
  end if;
  if expected_version is null or expected_version<0 or published is null then raise exception 'Invalid input' using errcode='23514'; end if;
  select * into q from public.community_questions where id=target_question and community_id=target_community for update;
  if not found or q.deleted_at is not null or q.hidden_at is not null or q.is_closed then
    raise exception 'Question is unavailable or closed' using errcode='23514';
  end if;
  select * into a from public.community_question_answers where id=target_id for update;
  if found and (a.community_id<>target_community or a.question_id<>target_question or a.author_id is distinct from auth.uid()
    or a.deleted_at is not null or a.hidden_at is not null) then raise exception 'Not allowed' using errcode='42501'; end if;
  if a.id is not null and (a.body,a.is_published) is not distinct from (btrim(answer_body),published) then
    return jsonb_build_object('id',a.id,'version',a.version);
  end if;
  if (a.id is null and expected_version<>0) or (a.id is not null and a.version<>expected_version) then
    raise exception 'Version conflict' using errcode='40001';
  end if;
  if a.id is null then
    insert into public.community_question_answers(id,community_id,question_id,author_id,body,is_published)
      values(target_id,target_community,target_question,auth.uid(),btrim(answer_body),published) returning * into saved;
  else
    update public.community_question_answers set body=btrim(answer_body),is_published=published where id=a.id returning * into saved;
  end if;
  if not published then
    update public.community_questions set is_faq=false where id=q.id and is_faq and not exists (
      select 1 from public.community_question_answers where question_id=q.id and is_published and hidden_at is null and deleted_at is null);
  end if;
  return jsonb_build_object('id',saved.id,'version',saved.version);
end;
$$;
revoke all on function community_private.save_question_answer(uuid,uuid,uuid,integer,text,boolean) from public,anon;
grant execute on function community_private.save_question_answer(uuid,uuid,uuid,integer,text,boolean) to authenticated;
create or replace function public.save_community_question_answer(target_community uuid,target_question uuid,target_id uuid,expected_version integer,answer_body text,published boolean)
returns jsonb language sql security invoker set search_path='' as $$
  select community_private.save_question_answer(target_community,target_question,target_id,expected_version,answer_body,published);
$$;
revoke all on function public.save_community_question_answer(uuid,uuid,uuid,integer,text,boolean) from public,anon;
grant execute on function public.save_community_question_answer(uuid,uuid,uuid,integer,text,boolean) to authenticated;

create or replace function community_private.save_question_category(
  target_community uuid,target_id uuid,expected_version integer,category_title text,sort_position integer,published boolean,archive boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.community_question_categories; saved public.community_question_categories;
begin
  if auth.uid() is null or not community_private.can_manage_profile(target_community,'content') then
    raise exception 'Not allowed' using errcode='42501';
  end if;
  if expected_version is null or expected_version<0 or published is null or archive is null then raise exception 'Invalid input' using errcode='23514'; end if;
  perform pg_advisory_xact_lock(hashtextextended('question-category:'||target_id::text,0));
  select * into c from public.community_question_categories where id=target_id for update;
  if found and c.community_id<>target_community then raise exception 'Not allowed' using errcode='42501'; end if;
  if c.deleted_at is not null then
    if archive then return jsonb_build_object('id',c.id,'version',c.version); end if;
    raise exception 'Category archived' using errcode='23514';
  end if;
  if c.id is not null and not archive and (c.title,c.position,c.is_published)
    is not distinct from (btrim(category_title),sort_position,published) then return jsonb_build_object('id',c.id,'version',c.version); end if;
  if (c.id is null and (expected_version<>0 or archive)) or (c.id is not null and c.version<>expected_version) then
    raise exception 'Version conflict' using errcode='40001';
  end if;
  if archive then
    if exists(select 1 from public.community_questions where community_id=target_community and category_id=c.id and deleted_at is null) then
      raise exception 'Move questions before removing category' using errcode='23503';
    end if;
    update public.community_question_categories set deleted_at=now() where id=c.id returning * into saved;
  elsif c.id is null then
    insert into public.community_question_categories(id,community_id,title,position,is_published)
      values(target_id,target_community,btrim(category_title),sort_position,published) returning * into saved;
  else
    update public.community_question_categories set title=btrim(category_title),position=sort_position,is_published=published where id=c.id returning * into saved;
  end if;
  return jsonb_build_object('id',saved.id,'version',saved.version);
end;
$$;
revoke all on function community_private.save_question_category(uuid,uuid,integer,text,integer,boolean,boolean) from public,anon;
grant execute on function community_private.save_question_category(uuid,uuid,integer,text,integer,boolean,boolean) to authenticated;
create or replace function public.save_community_question_category(target_community uuid,target_id uuid,expected_version integer,category_title text,sort_position integer,published boolean,archive boolean default false)
returns jsonb language sql security invoker set search_path='' as $$
  select community_private.save_question_category(target_community,target_id,expected_version,category_title,sort_position,published,archive);
$$;
revoke all on function public.save_community_question_category(uuid,uuid,integer,text,integer,boolean,boolean) from public,anon;
grant execute on function public.save_community_question_category(uuid,uuid,integer,text,integer,boolean,boolean) to authenticated;

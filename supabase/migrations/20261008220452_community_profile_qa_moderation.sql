create or replace function community_private.change_question(
  target_community uuid,target_id uuid,expected_version integer,operation text,
  reason text default '',target_category uuid default null,confirmed boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.community_questions; saved public.community_questions; moderator boolean; editor boolean;
begin
  if auth.uid() is null or not community_private.can_read_library(target_community,'public') then
    raise exception 'Not allowed' using errcode='42501';
  end if;
  if operation is null or operation not in ('close','reopen','faq','unfaq','hide','restore','archive','categorize')
    or expected_version is null or expected_version<1 then raise exception 'Invalid operation' using errcode='23514'; end if;
  moderator:=community_private.can_manage_profile(target_community,'moderation');
  editor:=community_private.can_manage_profile(target_community,'content');
  select * into q from public.community_questions where id=target_id and community_id=target_community for update;
  if not found then raise exception 'Question unavailable' using errcode='42501'; end if;
  if not (case
    when operation in ('faq','unfaq','categorize') then editor
    when operation='archive' then moderator or q.author_id=auth.uid()
    else moderator end) then raise exception 'Not allowed' using errcode='42501'; end if;
  if operation in ('hide','archive') and confirmed is distinct from true then
    raise exception 'Confirmation required' using errcode='23514';
  end if;
  if operation='hide' and (reason is null or char_length(btrim(reason)) not between 1 and 1000) then
    raise exception 'Moderation reason required' using errcode='23514';
  end if;
  if operation='archive' and q.deleted_at is not null then return jsonb_build_object('id',q.id,'version',q.version); end if;
  if q.deleted_at is not null then raise exception 'Question archived' using errcode='23514'; end if;
  if operation='faq' and (not q.is_published or q.hidden_at is not null or not exists (
    select 1 from public.community_question_answers where question_id=q.id and is_published and hidden_at is null and deleted_at is null
  )) then raise exception 'A FAQ needs a visible official answer' using errcode='23514'; end if;
  if operation='categorize' and target_category is not null then
    perform 1 from public.community_question_categories where id=target_category and community_id=target_community and deleted_at is null for share;
    if not found then raise exception 'Category unavailable' using errcode='23514'; end if;
  end if;
  if (operation='close' and q.is_closed) or (operation='reopen' and not q.is_closed)
    or (operation='faq' and q.is_faq) or (operation='unfaq' and not q.is_faq)
    or (operation='hide' and q.hidden_at is not null and q.moderation_reason=btrim(reason))
    or (operation='restore' and q.hidden_at is null)
    or (operation='categorize' and q.category_id is not distinct from target_category) then
    return jsonb_build_object('id',q.id,'version',q.version);
  end if;
  if q.version<>expected_version then raise exception 'Version conflict' using errcode='40001'; end if;
  update public.community_questions set
    is_closed=case operation when 'close' then true when 'reopen' then false else is_closed end,
    is_faq=case when operation='faq' then true when operation in ('unfaq','hide','archive') then false else is_faq end,
    hidden_at=case operation when 'hide' then now() when 'restore' then null else hidden_at end,
    moderation_reason=case operation when 'hide' then btrim(reason) when 'restore' then '' else moderation_reason end,
    deleted_at=case when operation='archive' then now() else deleted_at end,
    category_id=case when operation='categorize' then target_category else category_id end
    where id=q.id returning * into saved;
  return jsonb_build_object('id',saved.id,'version',saved.version);
end;
$$;
revoke all on function community_private.change_question(uuid,uuid,integer,text,text,uuid,boolean) from public,anon;
grant execute on function community_private.change_question(uuid,uuid,integer,text,text,uuid,boolean) to authenticated;
create or replace function public.change_community_question(target_community uuid,target_id uuid,expected_version integer,operation text,reason text default '',target_category uuid default null,confirmed boolean default false)
returns jsonb language sql security invoker set search_path='' as $$
  select community_private.change_question(target_community,target_id,expected_version,operation,reason,target_category,confirmed);
$$;
revoke all on function public.change_community_question(uuid,uuid,integer,text,text,uuid,boolean) from public,anon;
grant execute on function public.change_community_question(uuid,uuid,integer,text,text,uuid,boolean) to authenticated;

create or replace function community_private.change_question_answer(
  target_community uuid,target_question uuid,target_id uuid,expected_version integer,
  operation text,reason text default '',confirmed boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.community_questions; a public.community_question_answers; saved public.community_question_answers; moderator boolean;
begin
  if auth.uid() is null or not community_private.can_read_library(target_community,'public') then
    raise exception 'Not allowed' using errcode='42501';
  end if;
  if operation is null or operation not in ('hide','restore','archive') or expected_version is null or expected_version<1 then
    raise exception 'Invalid operation' using errcode='23514'; end if;
  select * into q from public.community_questions where id=target_question and community_id=target_community for update;
  if not found or q.deleted_at is not null then raise exception 'Question unavailable' using errcode='42501'; end if;
  select * into a from public.community_question_answers where id=target_id and question_id=q.id and community_id=target_community for update;
  if not found then raise exception 'Answer unavailable' using errcode='42501'; end if;
  moderator:=community_private.can_manage_profile(target_community,'moderation');
  if not moderator and not (operation='archive' and a.author_id=auth.uid() and community_private.can_manage_profile(target_community,'content')) then
    raise exception 'Not allowed' using errcode='42501'; end if;
  if operation in ('hide','archive') and confirmed is distinct from true then raise exception 'Confirmation required' using errcode='23514'; end if;
  if operation='hide' and (reason is null or char_length(btrim(reason)) not between 1 and 1000) then
    raise exception 'Moderation reason required' using errcode='23514'; end if;
  if operation='archive' and a.deleted_at is not null then return jsonb_build_object('id',a.id,'version',a.version); end if;
  if a.deleted_at is not null then raise exception 'Answer archived' using errcode='23514'; end if;
  if (operation='hide' and a.hidden_at is not null and a.moderation_reason=btrim(reason)) or (operation='restore' and a.hidden_at is null) then
    return jsonb_build_object('id',a.id,'version',a.version);
  end if;
  if a.version<>expected_version then raise exception 'Version conflict' using errcode='40001'; end if;
  update public.community_question_answers set
    hidden_at=case operation when 'hide' then now() when 'restore' then null else hidden_at end,
    moderation_reason=case operation when 'hide' then btrim(reason) when 'restore' then '' else moderation_reason end,
    deleted_at=case when operation='archive' then now() else deleted_at end where id=a.id returning * into saved;
  update public.community_questions set is_faq=false where id=q.id and is_faq and not exists (
    select 1 from public.community_question_answers where question_id=q.id and is_published and hidden_at is null and deleted_at is null);
  return jsonb_build_object('id',saved.id,'version',saved.version);
end;
$$;
revoke all on function community_private.change_question_answer(uuid,uuid,uuid,integer,text,text,boolean) from public,anon;
grant execute on function community_private.change_question_answer(uuid,uuid,uuid,integer,text,text,boolean) to authenticated;
create or replace function public.change_community_question_answer(target_community uuid,target_question uuid,target_id uuid,expected_version integer,operation text,reason text default '',confirmed boolean default false)
returns jsonb language sql security invoker set search_path='' as $$
  select community_private.change_question_answer(target_community,target_question,target_id,expected_version,operation,reason,confirmed);
$$;
revoke all on function public.change_community_question_answer(uuid,uuid,uuid,integer,text,text,boolean) from public,anon;
grant execute on function public.change_community_question_answer(uuid,uuid,uuid,integer,text,text,boolean) to authenticated;

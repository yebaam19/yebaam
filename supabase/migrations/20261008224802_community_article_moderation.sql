create or replace function community_private.change_article(target_community uuid,target_id uuid,expected_version integer,
  operation text,reason text default '',confirmed boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.community_articles; saved public.community_articles; allowed boolean;
begin
  if auth.uid() is null or not community_private.can_read_library(target_community,'public') then
    raise exception 'Not allowed' using errcode='42501'; end if;
  if operation is null or operation not in ('archive','hide','restore') or expected_version is null or expected_version<1 then
    raise exception 'Invalid operation' using errcode='23514'; end if;
  allowed:=community_private.can_manage_profile(target_community,'moderation')
    or (operation='archive' and community_private.can_manage_profile(target_community,'content'));
  if not allowed then raise exception 'Not allowed' using errcode='42501'; end if;
  if operation in ('archive','hide') and confirmed is distinct from true then raise exception 'Confirmation required' using errcode='23514'; end if;
  if operation='hide' and (reason is null or char_length(btrim(reason)) not between 1 and 1000) then
    raise exception 'Moderation reason required' using errcode='23514'; end if;
  select * into a from public.community_articles where id=target_id and community_id=target_community for update;
  if not found then raise exception 'Article unavailable' using errcode='42501'; end if;
  if operation='archive' and a.deleted_at is not null then return jsonb_build_object('id',a.id,'version',a.version); end if;
  if a.deleted_at is not null then raise exception 'Article archived' using errcode='42501'; end if;
  if (operation='hide' and a.hidden_at is not null and a.moderation_reason=btrim(reason)) or (operation='restore' and a.hidden_at is null) then
    return jsonb_build_object('id',a.id,'version',a.version); end if;
  if a.version<>expected_version then raise exception 'Version conflict' using errcode='40001'; end if;
  update public.community_articles set
    hidden_at=case operation when 'hide' then now() when 'restore' then null else hidden_at end,
    moderation_reason=case operation when 'hide' then btrim(reason) when 'restore' then '' else moderation_reason end,
    deleted_at=case when operation='archive' then now() else deleted_at end where id=a.id returning * into saved;
  return jsonb_build_object('id',saved.id,'version',saved.version);
end;
$$;
revoke all on function community_private.change_article(uuid,uuid,integer,text,text,boolean) from public,anon;
grant execute on function community_private.change_article(uuid,uuid,integer,text,text,boolean) to authenticated;
create or replace function public.change_community_article(target_community uuid,target_id uuid,expected_version integer,
  operation text,reason text default '',confirmed boolean default false)
returns jsonb language sql security invoker set search_path='' as $$
  select community_private.change_article(target_community,target_id,expected_version,operation,reason,confirmed);
$$;
revoke all on function public.change_community_article(uuid,uuid,integer,text,text,boolean) from public,anon;
grant execute on function public.change_community_article(uuid,uuid,integer,text,text,boolean) to authenticated;

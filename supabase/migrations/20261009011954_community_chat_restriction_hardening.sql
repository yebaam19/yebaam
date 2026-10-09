-- Keep platform oversight available and avoid retaining deleted actor IDs in audit JSON.
create or replace function community_private.audit_chat_restriction()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.community_chat_restriction_audit
    (community_id,user_id,actor_id,operation,before_data,after_data)
  values (new.community_id,new.user_id,(select auth.uid()),
    case when new.revoked_at is null then 'restrict' else 'release' end,
    case when tg_op='UPDATE' then to_jsonb(old)-'decided_by'-'revoked_by' end,
    to_jsonb(new)-'decided_by'-'revoked_by');
  return null;
end;
$$;
revoke all on function community_private.audit_chat_restriction()
  from public,anon,authenticated;

create or replace function public.set_community_chat_restriction(
  target_community uuid,target_user uuid,restriction_kind text,
  duration_hours integer,decision_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); owner_id uuid; clean_reason text;
  is_admin boolean;
begin
  is_admin:=community_private.can_manage_profile(target_community,'settings');
  if actor is null or not community_private.can_manage_profile(target_community,'moderation') then
    raise exception 'restriction_forbidden' using errcode='42501';
  end if;
  clean_reason:=btrim(coalesce(decision_reason,''));
  if char_length(clean_reason) not between 10 and 500
    or restriction_kind not in ('suspend','block')
    or (restriction_kind='suspend' and (duration_hours is null or duration_hours < 1
      or duration_hours > case when is_admin then 720 else 72 end))
    or (restriction_kind='block' and (not is_admin or duration_hours is not null)) then
    raise exception 'invalid_restriction' using errcode='23514';
  end if;
  select c.owner_id into owner_id from public.communities c where c.id=target_community;
  if owner_id is null or target_user is null or target_user in (actor,owner_id)
    or exists(select 1 from public.platform_admins p where p.user_id=target_user)
    or (not is_admin and exists(select 1 from public.community_profile_roles r
      where r.community_id=target_community and r.user_id=target_user
        and r.role in ('admin','moderator'))) then
    raise exception 'restriction_target_forbidden' using errcode='42501';
  end if;
  insert into public.community_chat_restrictions
    (community_id,user_id,kind,expires_at,reason,decided_by)
  values (target_community,target_user,restriction_kind,
    case when restriction_kind='suspend' then now()+make_interval(hours=>duration_hours) end,
    clean_reason,actor)
  on conflict (community_id,user_id) do update set
    kind=excluded.kind,expires_at=excluded.expires_at,reason=excluded.reason,
    decided_by=actor,decided_at=now(),revoked_at=null,revoked_by=null,
    revocation_reason='',version=community_chat_restrictions.version+1
  where is_admin or community_chat_restrictions.kind<>'block';
  if not found then
    raise exception 'restriction_target_forbidden' using errcode='42501';
  end if;
end;
$$;
revoke all on function public.set_community_chat_restriction(uuid,uuid,text,integer,text)
  from public,anon;
grant execute on function public.set_community_chat_restriction(uuid,uuid,text,integer,text)
  to authenticated;

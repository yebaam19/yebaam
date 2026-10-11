-- Qualify the owner column inside the privileged resolution RPC.
create or replace function public.resolve_community_chat_case(
  target_case uuid,decision text,decision_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=(select auth.uid()); case_row public.community_chat_cases%rowtype;
  owner_id uuid; admin_actor boolean; platform_actor boolean;
  clean_reason text:=btrim(coalesce(decision_reason,''));
begin
  if actor is null or decision not in ('dismiss','warn','restrict')
    or char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_case_decision' using errcode='23514';
  end if;
  select * into case_row from public.community_chat_cases
    where id=target_case for update;
  if not found then
    raise exception 'case_not_found' using errcode='P0002';
  end if;
  select c.owner_id into owner_id from public.communities c
    where c.id=case_row.community_id;
  platform_actor:=coalesce(public.is_platform_admin(),false);
  admin_actor:=platform_actor or community_private.can_manage_profile(
    case_row.community_id,'settings');
  if (not platform_actor and not community_private.can_manage_profile(
      case_row.community_id,'moderation'))
    or actor=case_row.requested_by
    or (case_row.requested_by is null and not platform_actor)
    or (case_row.requested_by=owner_id and not platform_actor) then
    raise exception 'case_review_forbidden' using errcode='42501';
  end if;
  if case_row.status='resolved' then
    if case_row.outcome=decision and case_row.resolved_by=actor
      and case_row.resolution_reason=clean_reason then return; end if;
    raise exception 'case_already_resolved' using errcode='23505';
  end if;
  if case_row.status<>'open' or case_row.defense_deadline is null
    or clock_timestamp()<case_row.defense_deadline
    or not exists (select 1 from community_private.community_chat_case_mail m
      where m.case_id=target_case and m.delivered_at is not null) then
    raise exception 'case_defense_open' using errcode='42501';
  end if;
  if decision<>'dismiss' and clock_timestamp()>
      community_private.chat_case_decision_deadline(case_row.defense_deadline) then
    raise exception 'case_decision_expired' using errcode='42501';
  end if;
  if decision='restrict' then
    if not exists (select 1 from public.community_chat_cases warning
      where warning.community_id=case_row.community_id
        and warning.user_id=case_row.user_id and warning.status='resolved'
        and warning.outcome='warn' and warning.resolved_at<case_row.created_at)
      or (case_row.kind='block' and
        not exists (select 1 from public.community_chat_restriction_audit prior
          where prior.community_id=case_row.community_id
            and prior.user_id=case_row.user_id and prior.operation='restrict'
            and prior.after_data->>'kind'='suspend'
            and prior.created_at<case_row.created_at)) then
      raise exception 'progressive_warning_required' using errcode='23514';
    end if;
    if case_row.user_id in (actor,owner_id)
      or exists(select 1 from public.platform_admins p
        where p.user_id=case_row.user_id)
      or not exists(select 1 from public.community_members m
        where m.community_id=case_row.community_id
          and m.user_id=case_row.user_id and m.status='active')
      or (not admin_actor and exists(select 1 from public.community_profile_roles r
        where r.community_id=case_row.community_id and r.user_id=case_row.user_id
          and r.role in ('admin','moderator')))
      or (case_row.kind='block' and not admin_actor) then
      raise exception 'case_target_forbidden' using errcode='42501';
    end if;
    insert into public.community_chat_restrictions
      (community_id,user_id,kind,expires_at,reason,decided_by)
    values (case_row.community_id,case_row.user_id,case_row.kind,
      case when case_row.kind='suspend' then
        clock_timestamp()+make_interval(hours=>case_row.duration_hours) end,
      clean_reason,actor)
    on conflict (community_id,user_id) do update set
      kind=excluded.kind,expires_at=excluded.expires_at,
      reason=excluded.reason,decided_by=actor,decided_at=clock_timestamp(),
      revoked_at=null,revoked_by=null,revocation_reason='',
      version=community_chat_restrictions.version+1
    where admin_actor or community_chat_restrictions.kind<>'block';
    if not found then
      raise exception 'case_target_forbidden' using errcode='42501';
    end if;
  end if;
  update public.community_chat_cases set status='resolved',outcome=decision,
    resolved_by=actor,resolved_at=clock_timestamp(),resolution_reason=clean_reason
    where id=target_case;
  insert into public.notifications(type,recipient_id,related_id,message,link)
  values ('community_chat_case_resolution',case_row.user_id,target_case,
    case decision when 'restrict' then
      'Se resolvió tu expediente y se limitó tu escritura en el chat. Puedes solicitar revisión.'
    when 'warn' then 'Se resolvió tu expediente con una advertencia, sin restringir tu escritura.'
    else 'Tu expediente del chat se cerró sin restricción.' end,
    '/feed/comunidades/'||(select slug from public.communities
      where id=case_row.community_id)||'/chat');
end;
$$;
revoke all on function public.resolve_community_chat_case(uuid,text,text)
  from public,anon;
grant execute on function public.resolve_community_chat_case(uuid,text,text)
  to authenticated;

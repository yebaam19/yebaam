-- Preserve pending provider consent when the author account is erased.
-- The actor FK may become NULL; the immutable marker remains authoritative.
alter table public.professional_services add column if not exists admin_draft boolean not null default false;
update public.professional_services set admin_draft=true where admin_created_by is not null and not admin_draft;

create or replace function public.guard_city_service_consent()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='UPDATE' then
    if new.admin_draft is distinct from old.admin_draft then raise exception 'immutable_draft_marker'; end if;
    if new.admin_created_by is distinct from old.admin_created_by
      and not (pg_trigger_depth()>1 and new.admin_created_by is null) then raise exception 'immutable_draft_author'; end if;
    if old.admin_draft and new.user_id is distinct from old.user_id then raise exception 'immutable_provider'; end if;
  end if;
  if tg_op='INSERT' and new.admin_created_by is not null then new.admin_draft := true; end if;
  if not new.admin_draft then return new; end if;
  if tg_op='INSERT' then
    if new.admin_created_by is distinct from auth.uid() or not public.is_platform_admin()
      or new.provider_declaration_accepted_at is not null or new.provider_declaration_version is not null
      then raise exception 'invalid_draft_author'; end if;
  elsif new.provider_declaration_accepted_at is distinct from old.provider_declaration_accepted_at
    or new.provider_declaration_version is distinct from old.provider_declaration_version then
    if old.provider_declaration_accepted_at is not null or auth.uid() is distinct from new.user_id
      or not public.has_verified_professional_profile() or new.provider_declaration_version is distinct from 'manual-2026-05-art12'
      then raise exception 'provider_acceptance_required'; end if;
    new.provider_declaration_accepted_at := now();
  end if;
  if new.provider_declaration_accepted_at is null and (new.visibility <> 'PRIVATE' or new.status <> 'PENDING_APPROVAL')
    then raise exception 'provider_acceptance_required'; end if;
  return new;
end $$;

-- Status is deliberately not UPDATE-granted to authenticated: owners must not
-- reactivate suspended services. Expose only this one pending-draft transition.
create or replace function public.accept_city_service_draft(p_id uuid,p_accepted boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare draft public.professional_services;
begin
  if auth.uid() is null or p_accepted is distinct from true then raise exception 'explicit_owner_consent_required'; end if;
  if not public.has_verified_professional_profile() then raise exception 'verified_provider_required'; end if;
  select * into draft from public.professional_services where id=p_id and user_id=auth.uid() for update;
  if not found or not draft.admin_draft then raise exception 'draft_not_found'; end if;
  if draft.provider_declaration_accepted_at is not null then return draft.id; end if;
  if draft.status <> 'PENDING_APPROVAL' or draft.visibility <> 'PRIVATE' then raise exception 'draft_not_pending'; end if;
  update public.professional_services set provider_declaration_accepted_at=now(),
    provider_declaration_version='manual-2026-05-art12',status='ACTIVE',visibility='PUBLIC',
    professional_profile_id=(select id from public.professional_profiles where user_id=auth.uid() limit 1)
    where id=draft.id;
  return draft.id;
end $$;
revoke all on function public.accept_city_service_draft(uuid,boolean) from public,anon;
grant execute on function public.accept_city_service_draft(uuid,boolean) to authenticated;

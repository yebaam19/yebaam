-- Status is deliberately not UPDATE-granted to authenticated: owners must not
-- reactivate suspended services. Expose only this one pending-draft transition.
create or replace function public.accept_city_service_draft(p_id uuid,p_accepted boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare draft public.professional_services;
begin
  if auth.uid() is null or p_accepted is distinct from true then raise exception 'explicit_owner_consent_required'; end if;
  if not public.has_verified_professional_profile() then raise exception 'verified_provider_required'; end if;
  select * into draft from public.professional_services where id=p_id and user_id=auth.uid() for update;
  if not found or draft.admin_created_by is null then raise exception 'draft_not_found'; end if;
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

-- Institutional delegates must be active members; leaving revokes the grant.
create table if not exists public.community_profile_role_audit (
  id bigint generated always as identity primary key,
  community_id uuid not null references public.communities(id) on delete cascade,
  subject_user_id uuid references auth.users(id) on delete set null,
  previous_role text,
  new_role text,
  previous_can_edit_plans boolean,
  new_can_edit_plans boolean,
  actor_user_id uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index if not exists community_profile_role_audit_community_idx
  on public.community_profile_role_audit(community_id, changed_at desc, id desc);
alter table public.community_profile_role_audit enable row level security;
revoke all on public.community_profile_role_audit from anon, authenticated;
grant select on public.community_profile_role_audit to authenticated;
drop policy if exists community_profile_role_audit_owner on public.community_profile_role_audit;
create policy community_profile_role_audit_owner on public.community_profile_role_audit
  for select to authenticated using (exists (
    select 1 from public.communities c
    where c.id=community_id and c.owner_id=(select auth.uid())
  ));

create or replace function community_private.validate_profile_role()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.community_id<>old.community_id or new.user_id<>old.user_id) then
    raise exception 'Role subject cannot change';
  end if;
  if exists (select 1 from public.communities c where c.id=new.community_id and c.owner_id=new.user_id) then
    raise exception 'The owner already has full access';
  end if;
  perform 1 from public.community_members m
    where m.community_id=new.community_id and m.user_id=new.user_id and m.status='active'
    for share;
  if not found then raise exception 'Institutional roles require active membership'; end if;
  if new.role <> 'editor' then new.can_edit_plans:=false; end if;
  return new;
end;
$$;
revoke all on function community_private.validate_profile_role() from public;
drop trigger if exists validate_profile_role on public.community_profile_roles;
create trigger validate_profile_role before insert or update on public.community_profile_roles
  for each row execute function community_private.validate_profile_role();

create or replace function community_private.audit_profile_role()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and old.role=new.role and old.can_edit_plans=new.can_edit_plans then return null; end if;
  insert into public.community_profile_role_audit(
    community_id,subject_user_id,previous_role,new_role,
    previous_can_edit_plans,new_can_edit_plans,actor_user_id
  ) values (
    case when tg_op='DELETE' then old.community_id else new.community_id end,
    case when tg_op='DELETE' then old.user_id else new.user_id end,
    case when tg_op='INSERT' then null else old.role end,
    case when tg_op='DELETE' then null else new.role end,
    case when tg_op='INSERT' then null else old.can_edit_plans end,
    case when tg_op='DELETE' then null else new.can_edit_plans end,
    auth.uid()
  );
  return null;
end;
$$;
revoke all on function community_private.audit_profile_role() from public;
drop trigger if exists audit_profile_role on public.community_profile_roles;
create trigger audit_profile_role after insert or update or delete on public.community_profile_roles
  for each row execute function community_private.audit_profile_role();

create or replace function community_private.revoke_departed_profile_role()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='DELETE' or (old.status='active' and new.status<>'active') then
    delete from public.community_profile_roles r
      where r.community_id=old.community_id and r.user_id=old.user_id;
  end if;
  return null;
end;
$$;
revoke all on function community_private.revoke_departed_profile_role() from public;
drop trigger if exists revoke_departed_profile_role on public.community_members;
create trigger revoke_departed_profile_role after update of status or delete on public.community_members
  for each row execute function community_private.revoke_departed_profile_role();

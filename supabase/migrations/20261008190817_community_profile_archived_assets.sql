-- Archived files cannot be attached again or prevent removal of an empty folder.
drop policy if exists plan_attachments_manage on public.community_plan_attachments;
create policy plan_attachments_manage on public.community_plan_attachments for all to authenticated
using (community_private.can_manage_profile(community_id, 'plans'))
with check (community_private.can_manage_profile(community_id, 'plans')
  and exists (select 1 from public.community_library_assets a where a.id = asset_id
    and a.community_id = community_plan_attachments.community_id and a.deleted_at is null));

create or replace function community_private.prepare_library_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.community_id <> old.community_id or new.kind <> old.kind then
      raise exception 'Library identity cannot change' using errcode = '23514';
    end if;
    new.version := old.version + 1;
    new.created_at := old.created_at;
  else
    new.version := 1;
    new.created_at := now();
  end if;
  if tg_table_name = 'community_library_assets' then
    if new.deleted_at is not null then new.folder_id := null; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function community_private.prepare_library_write() from public;

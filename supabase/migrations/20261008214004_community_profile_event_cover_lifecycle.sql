-- An archived cover must not block cancellation or removal of its event.
create or replace function community_private.validate_event()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op='UPDATE' and (new.id,new.community_id) is distinct from (old.id,old.community_id) then
    raise exception 'Event identity is immutable' using errcode='23514';
  end if;
  if new.cover_asset_id is not null and (tg_op='INSERT' or new.cover_asset_id is distinct from old.cover_asset_id) and not exists (
    select 1 from public.community_library_assets a where a.id=new.cover_asset_id
      and a.community_id=new.community_id and a.kind='image' and a.deleted_at is null
  ) then raise exception 'Cover is unavailable' using errcode='23514'; end if;
  new.version := case when tg_op='INSERT' then 1 else old.version+1 end;
  new.created_at := case when tg_op='INSERT' then now() else old.created_at end;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function community_private.validate_event() from public,anon,authenticated;

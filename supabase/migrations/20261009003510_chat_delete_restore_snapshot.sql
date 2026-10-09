-- Preserve the existing admin restore flow without leaving deleted content
-- readable through the public message table.
create table if not exists public.public_chat_delete_snapshots (
  message_id uuid primary key references public.public_chat_messages(id) on delete cascade,
  original jsonb not null,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz not null default now()
);
alter table public.public_chat_delete_snapshots enable row level security;
revoke all on public.public_chat_delete_snapshots from anon, authenticated;
grant all on public.public_chat_delete_snapshots to service_role;

create or replace function public.redact_deleted_chat_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not old.is_deleted and new.is_deleted then
    insert into public.public_chat_delete_snapshots(message_id, original, deleted_by)
    values (old.id, jsonb_build_object(
      'content', old.content, 'media_url', old.media_url,
      'media_type', old.media_type, 'media_meta', old.media_meta
    ), (select auth.uid()))
    on conflict (message_id) do update set
      original = excluded.original, deleted_by = excluded.deleted_by, deleted_at = now();
    new.content := case when new.moderation_hidden_at is not null
      then 'Contenido retirado por moderación' else 'Mensaje eliminado' end;
    new.media_url := null;
    new.media_type := null;
    new.media_meta := null;
    new.is_pinned := false;
    new.deletion_redacted_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.redact_deleted_chat_message() from public, anon, authenticated;

create or replace function public.restore_public_chat_admin_message(target_message uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare message_row public.public_chat_messages%rowtype; snapshot jsonb;
begin
  if (select auth.uid()) is null or not public.can_moderate_public_chat() then
    raise exception 'moderation_forbidden' using errcode = '42501';
  end if;
  select * into message_row from public.public_chat_messages
    where id = target_message for update;
  if not found or not message_row.is_deleted
    or message_row.moderation_hidden_at is not null then
    raise exception 'restore_forbidden' using errcode = '42501';
  end if;
  if message_row.deletion_redacted_at is not null then
    select original into snapshot from public.public_chat_delete_snapshots
      where message_id = target_message;
    if snapshot is null then raise exception 'missing_delete_snapshot'; end if;
    update public.public_chat_messages set
      content = snapshot->>'content', media_url = snapshot->>'media_url',
      media_type = snapshot->>'media_type',
      media_meta = nullif(snapshot->'media_meta', 'null'::jsonb),
      is_deleted = false, deletion_redacted_at = null
    where id = target_message;
    delete from public.public_chat_delete_snapshots where message_id = target_message;
  else
    update public.public_chat_messages set is_deleted = false
      where id = target_message;
  end if;
  return true;
end;
$$;
revoke all on function public.restore_public_chat_admin_message(uuid) from public, anon;
grant execute on function public.restore_public_chat_admin_message(uuid) to authenticated;

-- Direct column-level UPDATE may only hide a message, never restore a
-- redacted one without the private snapshot and moderator authorization.
create or replace function public.guard_moderated_chat_restore()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.is_deleted and not new.is_deleted and current_user in ('anon','authenticated')
    and (old.moderation_hidden_at is not null or old.deletion_redacted_at is not null) then
    raise exception 'chat_message_restore_forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_moderated_chat_restore() from public, anon, authenticated;

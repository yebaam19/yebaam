-- Historical soft-deleted rows may still contain content. Keep them visible
-- only to moderators; newly deleted rows become safe public tombstones.
alter table public.public_chat_messages
  add column if not exists deletion_redacted_at timestamptz;

create or replace function public.redact_deleted_chat_message()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not old.is_deleted and new.is_deleted then
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
drop trigger if exists redact_deleted_chat_message on public.public_chat_messages;
create trigger redact_deleted_chat_message before update of is_deleted
  on public.public_chat_messages for each row
  execute function public.redact_deleted_chat_message();

drop policy if exists public_chat_messages_select_all on public.public_chat_messages;
create policy public_chat_messages_select_all on public.public_chat_messages
  for select to anon, authenticated using (
    community_private.can_read_chat_topic(topic_id) and (
      not is_deleted or deletion_redacted_at is not null
      or (select public.can_moderate_public_chat())
      or exists (
        select 1 from public.public_chat_topics topic
        where topic.id = topic_id and topic.owner_type = 'community'
          and community_private.can_manage_profile(topic.owner_id, 'moderation')
      )
    )
  );

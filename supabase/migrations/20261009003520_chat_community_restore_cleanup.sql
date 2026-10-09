-- Restoring a moderated message also clears the generic delete tombstone.
create or replace function public.restore_community_chat_message(
  target_message uuid, restore_reason text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare message_row public.public_chat_messages%rowtype;
  snapshot jsonb; clean_reason text; target_community uuid;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  clean_reason := btrim(coalesce(restore_reason, ''));
  if char_length(clean_reason) not between 10 and 500 then
    raise exception 'invalid_restore_reason' using errcode = '23514';
  end if;
  select * into message_row from public.public_chat_messages
    where id = target_message for update;
  select topic.owner_id into target_community from public.public_chat_topics topic
    where topic.id = message_row.topic_id and topic.owner_type = 'community';
  if target_community is null or message_row.moderation_hidden_at is null
    or not community_private.can_manage_profile(target_community, 'moderation') then
    raise exception 'restore_forbidden' using errcode = '42501';
  end if;
  select log.message_snapshot into snapshot from public.community_chat_moderation_log log
    where log.message_id = target_message and log.action = 'hide'
    order by log.created_at desc, log.id desc limit 1;
  if snapshot is null then raise exception 'missing_moderation_snapshot'; end if;
  update public.public_chat_messages set
    content = snapshot->>'content', media_url = snapshot->>'media_url',
    media_type = snapshot->>'media_type',
    media_meta = nullif(snapshot->'media_meta', 'null'::jsonb),
    is_deleted = false, deletion_redacted_at = null,
    moderation_hidden_at = null, moderation_reason = '', moderated_by = null
  where id = target_message;
  delete from public.public_chat_delete_snapshots where message_id = target_message;
  insert into public.community_chat_moderation_log
    (community_id,message_id,actor_id,action,reason)
  values (target_community,target_message,(select auth.uid()),'restore',clean_reason);
  return true;
end;
$$;
revoke all on function public.restore_community_chat_message(uuid,text) from public,anon;
grant execute on function public.restore_community_chat_message(uuid,text) to authenticated;

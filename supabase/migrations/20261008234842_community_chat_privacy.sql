-- A community room inherits its community audience. Global and other
-- pre-existing rooms retain their current visibility.
create or replace function community_private.can_read_chat_topic(target_topic uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case when t.owner_type = 'community' then
      community_private.can_read_library(t.owner_id, 'public')
      or exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid()))
    else true end
    from public.public_chat_topics t where t.id = target_topic
  ), false);
$$;
revoke all on function community_private.can_read_chat_topic(uuid) from public;
grant execute on function community_private.can_read_chat_topic(uuid)
  to anon, authenticated, service_role;

create or replace function community_private.can_read_chat_message(target_message uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.public_chat_messages m
    where m.id = target_message and community_private.can_read_chat_topic(m.topic_id)
  );
$$;
revoke all on function community_private.can_read_chat_message(uuid) from public;
grant execute on function community_private.can_read_chat_message(uuid)
  to anon, authenticated, service_role;

drop policy if exists public_chat_topics_select_auth on public.public_chat_topics;
create policy public_chat_topics_select_auth on public.public_chat_topics
for select to authenticated using (
  owner_type is distinct from 'community'
  or community_private.can_read_library(owner_id, 'public')
  or exists (select 1 from public.platform_admins p where p.user_id = (select auth.uid()))
);
create policy public_chat_topics_select_community_anon on public.public_chat_topics
for select to anon using (
  owner_type = 'community' and community_private.can_read_library(owner_id, 'public')
);

drop policy if exists public_chat_messages_select_all on public.public_chat_messages;
create policy public_chat_messages_select_all on public.public_chat_messages
for select to anon, authenticated using (community_private.can_read_chat_topic(topic_id));

drop policy if exists nicknames_select_all on public.public_chat_nicknames;
create policy nicknames_select_all on public.public_chat_nicknames
for select to anon, authenticated using (community_private.can_read_chat_topic(room_id));

drop policy if exists presence_select_all on public.public_chat_presence;
create policy presence_select_all on public.public_chat_presence
for select to anon, authenticated using (community_private.can_read_chat_topic(room_id));

drop policy if exists room_members_select_all on public.public_chat_room_members;
create policy room_members_select_all on public.public_chat_room_members
for select to anon, authenticated using (community_private.can_read_chat_topic(room_id));

drop policy if exists promotions_select_all on public.public_chat_promotions;
create policy promotions_select_all on public.public_chat_promotions
for select to anon, authenticated using (
  is_active and (expires_at is null or expires_at > now())
  and community_private.can_read_chat_topic(room_id)
);

drop policy if exists reactions_select_all on public.public_chat_message_reactions;
create policy reactions_select_all on public.public_chat_message_reactions
for select to anon, authenticated using (community_private.can_read_chat_message(message_id));

drop policy if exists reactions_insert_auth on public.public_chat_message_reactions;
create policy reactions_insert_auth on public.public_chat_message_reactions
for insert to authenticated with check (
  user_id = (select auth.uid()) and community_private.can_read_chat_message(message_id)
);

drop policy if exists presence_auth_upsert on public.public_chat_presence;
create policy presence_auth_upsert on public.public_chat_presence
for insert to authenticated with check (
  user_id = (select auth.uid()) and community_private.can_read_chat_topic(room_id)
);
drop policy if exists presence_auth_update on public.public_chat_presence;
create policy presence_auth_update on public.public_chat_presence
for update to authenticated using (
  user_id = (select auth.uid()) and community_private.can_read_chat_topic(room_id)
) with check (
  user_id = (select auth.uid()) and community_private.can_read_chat_topic(room_id)
);

drop policy if exists room_members_self_insert on public.public_chat_room_members;
create policy room_members_self_insert on public.public_chat_room_members
for insert to authenticated with check (
  user_id = (select auth.uid()) and community_private.can_read_chat_topic(room_id)
);
drop policy if exists room_members_self_update on public.public_chat_room_members;
create policy room_members_self_update on public.public_chat_room_members
for update to authenticated using (
  user_id = (select auth.uid()) and community_private.can_read_chat_topic(room_id)
) with check (
  user_id = (select auth.uid()) and community_private.can_read_chat_topic(room_id)
);

-- Import is explicit, owner/admin initiated, atomic, and repeatable without duplicates.
-- The original JSON remains a backup; profile rendering switches to this section.
create or replace function public.import_community_plan_rules(target_community uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  section_uuid uuid;
  axis_uuid uuid;
  legacy_rules jsonb;
  rule jsonb;
begin
  if auth.uid() is null or not community_private.can_manage_profile(target_community, 'settings') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_community::text, 1));
  select id into section_uuid from public.community_sections
    where community_id = target_community and kind = 'rules';
  if section_uuid is not null then return section_uuid; end if;
  select rules into legacy_rules from public.communities where id = target_community;
  if jsonb_typeof(legacy_rules) <> 'array' then
    raise exception 'Invalid legacy rules' using errcode = '23514';
  end if;
  insert into public.community_sections(community_id, kind, title, position, is_visible)
    values (target_community, 'rules', 'Reglas', 1, jsonb_array_length(legacy_rules) > 0)
    returning id into section_uuid;
  if jsonb_array_length(legacy_rules) > 0 then
    insert into public.community_plan_axes(community_id, section_id, title, is_published)
      values (target_community, section_uuid, 'Reglas de la organización', true)
      returning id into axis_uuid;
    for rule in select value from jsonb_array_elements(legacy_rules) with ordinality
      order by case when value->>'order' ~ '^\d+$' then (value->>'order')::numeric end, ordinality
    loop
      insert into public.community_plan_points(community_id, section_id, axis_id, title, description, is_published)
        values (target_community, section_uuid, axis_uuid, rule->>'title', coalesce(rule->>'description', ''), true);
    end loop;
  end if;
  return section_uuid;
end;
$$;
revoke all on function public.import_community_plan_rules(uuid) from public;
grant execute on function public.import_community_plan_rules(uuid) to authenticated;

-- A hidden structured rules section must never fall back to its legacy copy.
-- Expose only the migration marker for organizations the caller can already read.
create or replace function community_private.uses_structured_rules(target_community uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.communities c join public.community_sections s on s.community_id = c.id
    where c.id = target_community and s.kind = 'rules' and (
      c.privacy = 'PUBLIC' or c.owner_id = (select auth.uid()) or exists (
        select 1 from public.community_members m where m.community_id = c.id
          and m.user_id = (select auth.uid()) and m.status = 'active'
      )
    )
  );
$$;
revoke all on function community_private.uses_structured_rules(uuid) from public;
grant execute on function community_private.uses_structured_rules(uuid) to anon, authenticated;
create or replace function public.community_uses_structured_rules(target_community uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select community_private.uses_structured_rules(target_community);
$$;
revoke all on function public.community_uses_structured_rules(uuid) from public;
grant execute on function public.community_uses_structured_rules(uuid) to anon, authenticated;

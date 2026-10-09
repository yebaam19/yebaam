-- Archive the original privately, so hiding imported rules cannot leak their
-- former JSON through the publicly readable communities row.
create or replace function community_private.import_plan_rules(target_community uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
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
  select rules into legacy_rules from public.communities where id = target_community for update;
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
    insert into public.community_profile_revisions
      (community_id, entity_table, entity_id, operation, actor_id, before_data, after_data)
      values (target_community, 'communities_legacy_rules', target_community, 'UPDATE', auth.uid(),
        jsonb_build_object('rules', legacy_rules), jsonb_build_object('section_id', section_uuid));
    update public.communities set rules = '[]'::jsonb where id = target_community;
  end if;
  return section_uuid;
end;
$$;
revoke all on function community_private.import_plan_rules(uuid) from public;
grant execute on function community_private.import_plan_rules(uuid) to authenticated;

create or replace function public.import_community_plan_rules(target_community uuid)
returns uuid language sql security invoker set search_path = '' as $$
  select community_private.import_plan_rules(target_community);
$$;
revoke all on function public.import_community_plan_rules(uuid) from public;
grant execute on function public.import_community_plan_rules(uuid) to authenticated;

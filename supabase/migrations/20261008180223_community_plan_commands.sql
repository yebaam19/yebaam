-- Moves one entity relative to another; never accept a client-supplied full plan.
-- Reordering is an infrequent editorial operation. Reads use the ordered indexes.
create or replace function public.move_community_plan_item(
  target_community uuid, target_section uuid, entity_kind text, entity_id uuid,
  expected_version integer, destination_axis uuid default null, before_id uuid default null
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  table_name text;
  current_version integer;
  parent_filter text;
  ordered_ids uuid[];
  insertion_index integer;
begin
  if auth.uid() is null or not community_private.can_manage_profile(target_community, 'plans') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if entity_kind not in ('axis', 'point') then
    raise exception 'Invalid entity kind' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_section::text, 0));
  table_name := case entity_kind when 'axis' then 'community_plan_axes' else 'community_plan_points' end;
  execute format('select version from public.%I where id = $1 and community_id = $2
    and section_id = $3 for update', table_name)
    into current_version using entity_id, target_community, target_section;
  if current_version is null or current_version <> expected_version then
    raise exception 'Content changed; reload before editing' using errcode = '40001';
  end if;
  if before_id = entity_id then return; end if;
  if entity_kind = 'point' then
    if destination_axis is null or not exists (
      select 1 from public.community_plan_axes where id = destination_axis
        and community_id = target_community and section_id = target_section
    ) then
      raise exception 'Invalid destination axis' using errcode = '23514';
    end if;
    parent_filter := ' and axis_id = $4';
  else
    if destination_axis is not null then
      raise exception 'Axes cannot have a parent axis' using errcode = '22023';
    end if;
    parent_filter := '';
  end if;
  execute format('select coalesce(array_agg(id order by position, id), array[]::uuid[])
    from public.%I where community_id = $1 and section_id = $2 and id <> $3%s',
    table_name, parent_filter)
    into ordered_ids using target_community, target_section, entity_id, destination_axis;
  insertion_index := case when before_id is null then cardinality(ordered_ids) + 1
    else array_position(ordered_ids, before_id) end;
  if insertion_index is null then
    raise exception 'Invalid insertion target' using errcode = '23514';
  end if;
  ordered_ids := ordered_ids[1:insertion_index-1] || array[entity_id] || ordered_ids[insertion_index:];
  if entity_kind = 'point' then
    update public.community_plan_points set axis_id = destination_axis
      where id = entity_id and axis_id <> destination_axis;
  end if;
  execute format('update public.%I item set position = ordering.ordinality - 1
    from unnest($1::uuid[]) with ordinality ordering(id, ordinality)
    where item.id = ordering.id and item.position <> ordering.ordinality - 1', table_name)
    using ordered_ids;
end;
$$;
revoke all on function public.move_community_plan_item(uuid, uuid, text, uuid, integer, uuid, uuid) from public;
grant execute on function public.move_community_plan_item(uuid, uuid, text, uuid, integer, uuid, uuid)
  to authenticated;

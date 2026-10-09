-- New items append in a transaction, including simultaneous editor inserts.
create or replace function community_private.append_plan_position()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.section_id::text, 0));
  if tg_table_name = 'community_plan_axes' then
    select coalesce(max(position), -1) + 1 into new.position
      from public.community_plan_axes
      where community_id = new.community_id and section_id = new.section_id;
  else
    select coalesce(max(position), -1) + 1 into new.position
      from public.community_plan_points where community_id = new.community_id
        and section_id = new.section_id and axis_id = new.axis_id;
  end if;
  return new;
end;
$$;
revoke all on function community_private.append_plan_position() from public;
drop trigger if exists append_plan_position on public.community_plan_axes;
create trigger append_plan_position before insert on public.community_plan_axes
  for each row execute function community_private.append_plan_position();
drop trigger if exists append_plan_position on public.community_plan_points;
create trigger append_plan_position before insert on public.community_plan_points
  for each row execute function community_private.append_plan_position();

grant all on public.community_profile_roles, public.community_sections,
  public.community_plan_axes, public.community_plan_points,
  public.community_profile_revisions to service_role;
grant usage, select on sequence public.community_profile_revisions_id_seq to service_role;

-- One bounded read for a page of points; every join remains subject to RLS.
create or replace function public.community_plan_attachment_previews(target_community uuid, point_ids uuid[])
returns table (point_id uuid, items jsonb)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if point_ids is null or cardinality(point_ids) > 30 then
    raise exception 'At most 30 point IDs are allowed' using errcode = '22023';
  end if;
  return query
  select p.id, coalesce(preview.items, '[]'::jsonb)
  from public.community_plan_points p
  cross join lateral (
    select jsonb_agg(to_jsonb(a) order by a.position, a.id) as items
    from (
      select link.id, link.community_id, link.point_id, link.asset_id, link.position,
        to_jsonb(asset) as asset
      from public.community_plan_attachments link
      join lateral (
        select f.id, f.community_id, f.kind, f.folder_id, f.title, f.description,
          f.media_id, f.original_name, f.content_type, f.size_bytes, f.duration_seconds,
          f.uploaded_by, f.visibility, f.is_published, f.version, f.created_at
        from public.community_library_assets f
        where f.id = link.asset_id and f.community_id = target_community and f.deleted_at is null
      ) asset on true
      where link.community_id = target_community and link.point_id = p.id
      order by link.position, link.id limit 4
    ) a
  ) preview
  where p.community_id = target_community and p.id = any(point_ids);
end;
$$;
revoke all on function public.community_plan_attachment_previews(uuid, uuid[]) from public;
grant execute on function public.community_plan_attachment_previews(uuid, uuid[]) to anon, authenticated;

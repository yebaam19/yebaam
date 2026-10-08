create unique index if not exists community_plan_points_identity_idx on public.community_plan_points(community_id, id);
create table if not exists public.community_plan_attachments (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  point_id uuid not null,
  asset_id uuid not null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (point_id, asset_id),
  foreign key (community_id, point_id) references public.community_plan_points(community_id, id) on delete cascade,
  foreign key (community_id, asset_id) references public.community_library_assets(community_id, id)
);
create index if not exists community_plan_attachments_order_idx
  on public.community_plan_attachments(community_id, point_id, position, id);
create index if not exists community_plan_attachments_asset_idx
  on public.community_plan_attachments(community_id, asset_id);
alter table public.community_plan_attachments enable row level security;
revoke all on public.community_plan_attachments from anon, authenticated;
grant select on public.community_plan_attachments to anon, authenticated;
grant insert, delete on public.community_plan_attachments to authenticated;
grant update (position) on public.community_plan_attachments to authenticated;
grant all on public.community_plan_attachments to service_role;
drop policy if exists plan_attachments_read on public.community_plan_attachments;
create policy plan_attachments_read on public.community_plan_attachments for select to anon, authenticated
using (exists (select 1 from public.community_plan_points p where p.id = point_id
  and p.community_id = community_plan_attachments.community_id)
  and exists (select 1 from public.community_library_assets a where a.id = asset_id
    and a.community_id = community_plan_attachments.community_id));
drop policy if exists plan_attachments_manage on public.community_plan_attachments;
create policy plan_attachments_manage on public.community_plan_attachments for all to authenticated
using (community_private.can_manage_profile(community_id, 'plans'))
with check (community_private.can_manage_profile(community_id, 'plans')
  and exists (select 1 from public.community_library_assets a where a.id = asset_id
    and a.community_id = community_plan_attachments.community_id));
drop trigger if exists record_attachment_revision on public.community_plan_attachments;
create trigger record_attachment_revision after insert or update or delete on public.community_plan_attachments
  for each row execute function community_private.record_plan_revision();

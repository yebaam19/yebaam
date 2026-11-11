-- City administration uses canonical Negocios (comidas), not legacy public.businesses.
alter table comidas.businesses add column if not exists city_id uuid references public.cities(id) on delete set null;
alter table comidas.businesses add column if not exists legal_name text;
alter table comidas.businesses add column if not exists tax_id text;
alter table comidas.businesses add column if not exists prices_include_tax boolean not null default false;
alter table comidas.businesses add column if not exists city_admin_created boolean not null default false;
create index if not exists businesses_city_active_idx on comidas.businesses(city_id, is_active, name) where deleted_at is null;

-- Preserve existing city listings while repairing their canonical detail links.
-- Originals remain untouched; matching canonical records are never overwritten.
insert into comidas.businesses(id,created_by,city_id,city,name,slug,category,description,address,phone,email,website,profile_cf_image_id,is_active)
select b.id,b.owner_id,b.city_id,c.name,b.name,b.slug,coalesce(cat.slug,'otros'),b.description,b.address,b.phone,b.email,b.website,
  substring(coalesce(b.logo_url,b.cover_url,b.ad_image_url) from '^https://imagedelivery\.net/[^/]+/([A-Za-z0-9_-]{20,64})/'),
  b.visibility='PUBLIC' and b.status='ACTIVE'
from public.businesses b left join public.cities c on c.id=b.city_id
left join public.business_categories cat on cat.id=b.category_id
where not exists(select 1 from comidas.businesses n where n.id=b.id or n.slug=b.slug);

alter table comidas.businesses drop constraint if exists city_admin_business_disclosures;
alter table comidas.businesses add constraint city_admin_business_disclosures check (
  not city_admin_created or not is_active or
  (length(trim(coalesce(legal_name,'')))>0 and length(trim(coalesce(tax_id,'')))>0
   and length(trim(coalesce(address,'')))>0 and length(trim(coalesce(phone,'')))>0 and prices_include_tax));

-- The schema is intentionally not exposed to PostgREST. These narrow RPCs
-- authorize the actor before accessing it and return explicit bounded fields.
create or replace function public.admin_save_city_business(p_id uuid, p_city_id uuid, p_data jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare previous comidas.businesses; city_name text;
begin
  if auth.uid() is null or not public.is_platform_admin() then raise exception 'forbidden'; end if;
  select name into city_name from public.cities where id = p_city_id;
  if city_name is null then raise exception 'invalid_city'; end if;
  if length(trim(coalesce(p_data->>'name',''))) not between 2 and 120
    or length(coalesce(p_data->>'description','')) > 4000
    or length(coalesce(p_data->>'address','')) > 500
    or length(coalesce(p_data->>'phone','')) > 40
    or length(coalesce(p_data->>'legal_name','')) > 150
    or length(coalesce(p_data->>'tax_id','')) > 80
    or coalesce(p_data->>'slug','') !~ '^[a-z0-9][a-z0-9-]{1,119}$'
    or not exists(select 1 from public.business_categories where slug = p_data->>'category')
  then raise exception 'invalid_input'; end if;
  if coalesce((p_data->>'is_active')::boolean,false) and
    (length(trim(coalesce(p_data->>'legal_name',''))) = 0 or length(trim(coalesce(p_data->>'tax_id',''))) = 0
    or length(trim(coalesce(p_data->>'address',''))) = 0 or length(trim(coalesce(p_data->>'phone',''))) = 0
    or not coalesce((p_data->>'prices_include_tax')::boolean,false)) then raise exception 'business_disclosures_required'; end if;
  select * into previous from comidas.businesses where id = p_id for update;
  if found and previous.city_id is distinct from p_city_id then raise exception 'city_mismatch'; end if;
  insert into comidas.businesses(id,created_by,city_id,city,name,slug,category,description,address,phone,
    legal_name,tax_id,prices_include_tax,is_active,city_admin_created)
  values(p_id,auth.uid(),p_city_id,city_name,trim(p_data->>'name'),p_data->>'slug',p_data->>'category',
    p_data->>'description',p_data->>'address',p_data->>'phone',p_data->>'legal_name',p_data->>'tax_id',
    coalesce((p_data->>'prices_include_tax')::boolean,false),coalesce((p_data->>'is_active')::boolean,false),true)
  on conflict(id) do update set name=excluded.name,category=excluded.category,description=excluded.description,
    address=excluded.address,phone=excluded.phone,legal_name=excluded.legal_name,tax_id=excluded.tax_id,
    prices_include_tax=excluded.prices_include_tax,is_active=excluded.is_active,updated_at=now();
  return p_id;
end $$;
revoke all on function public.admin_save_city_business(uuid,uuid,jsonb) from public,anon;
grant execute on function public.admin_save_city_business(uuid,uuid,jsonb) to authenticated;

create or replace function public.list_city_businesses(p_city_id uuid,p_admin boolean default false,p_page integer default 1,p_category text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_admin and (auth.uid() is null or not public.is_platform_admin()) then raise exception 'forbidden'; end if;
  select jsonb_build_object('items',coalesce(jsonb_agg(t),'[]'::jsonb),'total',
    (select count(*) from comidas.businesses b where b.city_id=p_city_id and b.deleted_at is null and (p_admin or b.is_active) and (p_category is null or b.category=p_category))) into result
  from (select b.id,b.slug,b.city_id,b.name,b.category,b.description,b.address,b.phone,b.profile_cf_image_id,
    b.legal_name,b.tax_id,b.prices_include_tax,b.is_active,b.avg_rating,b.review_count
    from comidas.businesses b where b.city_id=p_city_id and b.deleted_at is null and (p_admin or b.is_active) and (p_category is null or b.category=p_category)
    order by b.name,b.id limit 24 offset (greatest(1,least(coalesce(p_page,1),10000))-1)*24)t;
  return result;
end $$;
revoke all on function public.list_city_businesses(uuid,boolean,integer,text) from public;
grant execute on function public.list_city_businesses(uuid,boolean,integer,text) to anon,authenticated;

create or replace function public.city_business_disclosures(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('legal_name',b.legal_name,'tax_id',b.tax_id,'address',b.address,'phone',b.phone,'prices_include_tax',b.prices_include_tax)
 from comidas.businesses b where b.id=p_id and b.is_active and b.deleted_at is null and b.city_admin_created;
$$;
revoke all on function public.city_business_disclosures(uuid) from public;
grant execute on function public.city_business_disclosures(uuid) to anon,authenticated;

-- A draft is assigned to an existing provider; an administrator cannot sign
-- the provider's declaration or publish it on the provider's behalf.
alter table public.professional_services add column if not exists admin_created_by uuid references auth.users(id) on delete set null;
alter table public.professional_services add column if not exists provider_declaration_version text;
create index if not exists professional_services_city_status_name_idx on public.professional_services(city_id,status,name,id);
drop policy if exists psvc_admin_city_draft_insert on public.professional_services;
create policy psvc_admin_city_draft_insert on public.professional_services for insert to authenticated
with check (public.is_platform_admin() and admin_created_by=auth.uid() and city_id is not null
  and visibility='PRIVATE' and status='PENDING_APPROVAL' and provider_declaration_accepted_at is null);

create or replace function public.guard_city_service_consent()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='UPDATE' then
    if new.admin_created_by is distinct from old.admin_created_by then raise exception 'immutable_draft_author'; end if;
    if old.admin_created_by is not null and new.user_id is distinct from old.user_id then raise exception 'immutable_provider'; end if;
  end if;
  if new.admin_created_by is null then return new; end if;
  if tg_op='INSERT' then
    if new.admin_created_by is distinct from auth.uid() or not public.is_platform_admin()
      or new.provider_declaration_accepted_at is not null or new.provider_declaration_version is not null
      then raise exception 'invalid_draft_author'; end if;
  elsif new.provider_declaration_accepted_at is distinct from old.provider_declaration_accepted_at
    or new.provider_declaration_version is distinct from old.provider_declaration_version then
    if old.provider_declaration_accepted_at is not null or auth.uid() is distinct from new.user_id
      or not public.has_verified_professional_profile() or new.provider_declaration_version is distinct from 'manual-2026-05-art12'
      then raise exception 'provider_acceptance_required'; end if;
    new.provider_declaration_accepted_at := now();
  end if;
  if new.provider_declaration_accepted_at is null and (new.visibility <> 'PRIVATE' or new.status <> 'PENDING_APPROVAL')
    then raise exception 'provider_acceptance_required'; end if;
  return new;
end $$;
revoke all on function public.guard_city_service_consent() from public,anon,authenticated;
drop trigger if exists guard_city_service_consent on public.professional_services;
create trigger guard_city_service_consent before insert or update on public.professional_services
for each row execute function public.guard_city_service_consent();

-- Public promotion pages read through RPC because the comidas schema is not
-- exposed through PostgREST. Keep draft, expired, and inactive-business data
-- out of these SECURITY DEFINER functions.

create or replace function public.list_active_promotions()
returns setof comidas.promotions
language sql
stable
security definer
set search_path = public, comidas
as $$
  select promotion.*
  from comidas.promotions as promotion
  join comidas.businesses as business
    on business.id = promotion.business_id
  where promotion.status = 'ACTIVE'
    and (promotion.starts_at is null or promotion.starts_at <= now())
    and (promotion.ends_at is null or promotion.ends_at >= now())
    and business.is_active = true
    and business.deleted_at is null
  order by promotion.is_highlighted desc, promotion.created_at desc;
$$;

create or replace function public.get_promotion_by_id(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, comidas
as $$
  select to_jsonb(promotion.*)
  from comidas.promotions as promotion
  join comidas.businesses as business
    on business.id = promotion.business_id
  where promotion.id = p_id
    and promotion.status = 'ACTIVE'
    and (promotion.starts_at is null or promotion.starts_at <= now())
    and (promotion.ends_at is null or promotion.ends_at >= now())
    and business.is_active = true
    and business.deleted_at is null;
$$;

revoke all on function public.list_active_promotions() from public;
revoke all on function public.get_promotion_by_id(uuid) from public;

grant execute on function public.list_active_promotions() to anon, authenticated, service_role;
grant execute on function public.get_promotion_by_id(uuid) to anon, authenticated, service_role;

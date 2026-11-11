-- Admin-authored directory information is separate from user-owned businesses.
CREATE TABLE IF NOT EXISTS public.city_directory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.business_categories(id),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 150),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 4000),
  address text NOT NULL DEFAULT '' CHECK (length(address) <= 500),
  phone text NOT NULL DEFAULT '' CHECK (length(phone) <= 40),
  website text NOT NULL DEFAULT '' CHECK (website = '' OR (length(website) <= 2048 AND website ~ '^https?://[^[:space:]]+$')),
  cover_cf_image_id text CHECK (cover_cf_image_id ~ '^[A-Za-z0-9_-]{20,64}$'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS city_directory_entries_listing_idx
  ON public.city_directory_entries(city_id, category_id, status, id);
ALTER TABLE public.city_directory_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.city_directory_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.city_directory_entries TO anon, authenticated;
GRANT INSERT, UPDATE ON public.city_directory_entries TO authenticated;
DROP POLICY IF EXISTS directory_read ON public.city_directory_entries;
CREATE POLICY directory_read ON public.city_directory_entries FOR SELECT TO anon, authenticated
  USING (status = 'published' OR (SELECT public.is_platform_admin()));
DROP POLICY IF EXISTS directory_insert ON public.city_directory_entries;
CREATE POLICY directory_insert ON public.city_directory_entries FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_platform_admin()));
DROP POLICY IF EXISTS directory_update ON public.city_directory_entries;
CREATE POLICY directory_update ON public.city_directory_entries FOR UPDATE TO authenticated
  USING ((SELECT public.is_platform_admin())) WITH CHECK ((SELECT public.is_platform_admin()));

CREATE TABLE IF NOT EXISTS public.city_directory_entry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.city_directory_entries(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_directory_entry_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.city_directory_entry_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.city_directory_entry_events TO authenticated;
DROP POLICY IF EXISTS directory_events_read ON public.city_directory_entry_events;
CREATE POLICY directory_events_read ON public.city_directory_entry_events FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));
DROP POLICY IF EXISTS directory_events_insert ON public.city_directory_entry_events;
CREATE POLICY directory_events_insert ON public.city_directory_entry_events FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_platform_admin()) AND actor_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.stamp_city_directory_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_platform_admin() OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Administrator required' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  ELSE
    IF NEW.city_id <> OLD.city_id OR NEW.category_id <> OLD.category_id THEN
      RAISE EXCEPTION 'Entry city and category are immutable' USING ERRCODE = '22023';
    END IF;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.audit_city_directory_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.city_directory_entry_events(entry_id, actor_id, status)
    VALUES (NEW.id, auth.uid(), NEW.status);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stamp_city_directory_entry() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_city_directory_entry() FROM PUBLIC;
DROP TRIGGER IF EXISTS stamp_directory_entry ON public.city_directory_entries;
CREATE TRIGGER stamp_directory_entry BEFORE INSERT OR UPDATE ON public.city_directory_entries
  FOR EACH ROW EXECUTE FUNCTION public.stamp_city_directory_entry();
DROP TRIGGER IF EXISTS audit_directory_entry ON public.city_directory_entries;
CREATE TRIGGER audit_directory_entry AFTER INSERT OR UPDATE ON public.city_directory_entries
  FOR EACH ROW EXECUTE FUNCTION public.audit_city_directory_entry();

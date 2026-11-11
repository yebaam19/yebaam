-- City administrators author events; drafts are private until explicitly published.
CREATE TABLE IF NOT EXISTS public.city_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 150),
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 4000),
 venue text NOT NULL CHECK (length(btrim(venue)) BETWEEN 1 AND 300),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
 time_zone text NOT NULL DEFAULT 'UTC' CHECK (length(time_zone) BETWEEN 1 AND 100),
 website text NOT NULL DEFAULT '' CHECK (website = '' OR (length(website) <= 2048 AND website ~ '^https?://[^[:space:]]+$')),
 cover_cf_image_id text CHECK (cover_cf_image_id ~ '^[A-Za-z0-9_-]{20,64}$'),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS city_events_listing_idx ON public.city_events(city_id, status, starts_at, id);
ALTER TABLE public.city_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.city_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.city_events TO anon, authenticated;
GRANT INSERT, UPDATE ON public.city_events TO authenticated;
DROP POLICY IF EXISTS city_events_read ON public.city_events;
CREATE POLICY city_events_read ON public.city_events FOR SELECT TO anon, authenticated
 USING (status = 'published' OR (SELECT public.is_platform_admin()));
DROP POLICY IF EXISTS city_events_insert ON public.city_events;
CREATE POLICY city_events_insert ON public.city_events FOR INSERT TO authenticated
 WITH CHECK ((SELECT public.is_platform_admin()));
DROP POLICY IF EXISTS city_events_update ON public.city_events;
CREATE POLICY city_events_update ON public.city_events FOR UPDATE TO authenticated
 USING ((SELECT public.is_platform_admin())) WITH CHECK ((SELECT public.is_platform_admin()));

CREATE TABLE IF NOT EXISTS public.city_event_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.city_events(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_event_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.city_event_history FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.city_event_history TO authenticated;
DROP POLICY IF EXISTS city_event_history_read ON public.city_event_history;
CREATE POLICY city_event_history_read ON public.city_event_history FOR SELECT TO authenticated
  USING ((SELECT public.is_platform_admin()));
DROP POLICY IF EXISTS city_event_history_insert ON public.city_event_history;
CREATE POLICY city_event_history_insert ON public.city_event_history FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_platform_admin()) AND actor_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.stamp_city_event()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_platform_admin() OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Administrator required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = NEW.time_zone) THEN
    RAISE EXCEPTION 'Invalid time zone' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  ELSE
    IF NEW.city_id <> OLD.city_id THEN
      RAISE EXCEPTION 'Event city is immutable' USING ERRCODE = '22023';
    END IF;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.audit_city_event()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.city_event_history(event_id, actor_id, status)
    VALUES (NEW.id, auth.uid(), NEW.status);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.stamp_city_event() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_city_event() FROM PUBLIC;
DROP TRIGGER IF EXISTS stamp_event ON public.city_events;
CREATE TRIGGER stamp_event BEFORE INSERT OR UPDATE ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.stamp_city_event();
DROP TRIGGER IF EXISTS audit_event ON public.city_events;
CREATE TRIGGER audit_event AFTER INSERT OR UPDATE ON public.city_events
  FOR EACH ROW EXECUTE FUNCTION public.audit_city_event();

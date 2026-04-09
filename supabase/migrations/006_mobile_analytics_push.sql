-- Mobile app telemetry (Expo WebView shell) and Expo push token registry.
-- Written only via Next.js API routes using the service role (not exposed to anon).

CREATE TABLE IF NOT EXISTS public.mobile_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  event_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp timestamptz,
  session_duration_ms integer,
  app_version text,
  app_build text,
  platform text,
  device_brand text,
  device_model text,
  os_version text,
  is_connected boolean,
  user_agent text,
  client_ip text
);

CREATE INDEX IF NOT EXISTS idx_mobile_analytics_received_at
  ON public.mobile_analytics_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_mobile_analytics_event_name
  ON public.mobile_analytics_events (event_name);

CREATE TABLE IF NOT EXISTS public.expo_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expo_push_token text NOT NULL UNIQUE,
  platform text,
  app_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_updated
  ON public.expo_push_tokens (updated_at DESC);

CREATE OR REPLACE FUNCTION public.trg_expo_push_tokens_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expo_push_tokens_updated ON public.expo_push_tokens;
CREATE TRIGGER trg_expo_push_tokens_updated
  BEFORE UPDATE ON public.expo_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_expo_push_tokens_set_updated_at();

ALTER TABLE public.mobile_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expo_push_tokens ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role / postgres can access (dashboard SQL, API with service key).

COMMENT ON TABLE public.mobile_analytics_events IS 'Ingest from Buscadis mobile app native layer via POST /api/mobile-analytics';
COMMENT ON TABLE public.expo_push_tokens IS 'Expo push tokens registered from app via POST /api/mobile-push/register';

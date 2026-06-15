-- ============================================
-- Behavioral Intelligence Platform (Moat)
-- Events, profiles, demand intents, matching, campaigns, graph
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Legacy analytics (ensure exists in numbered migrations)
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  tipo_evento text NOT NULL,
  evento text NOT NULL,
  datos jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public analytics insert" ON public.user_analytics;
CREATE POLICY "Public analytics insert"
  ON public.user_analytics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own analytics" ON public.user_analytics;
CREATE POLICY "Users view own analytics"
  ON public.user_analytics FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON public.user_analytics(created_at);

-- ============================================
-- behavioral_events
-- ============================================
CREATE TABLE IF NOT EXISTS public.behavioral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  anonymous_id text,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_delta float DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_events_user_created
  ON public.behavioral_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_behavioral_events_session
  ON public.behavioral_events (session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_behavioral_events_type_created
  ON public.behavioral_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavioral_events_entity
  ON public.behavioral_events (entity_type, entity_id, created_at DESC);

ALTER TABLE public.behavioral_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public behavioral events insert" ON public.behavioral_events;
CREATE POLICY "Public behavioral events insert"
  ON public.behavioral_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own behavioral events" ON public.behavioral_events;
CREATE POLICY "Users view own behavioral events"
  ON public.behavioral_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- user_behavior_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_behavior_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  category_affinity jsonb NOT NULL DEFAULT '{}'::jsonb,
  keyword_affinity jsonb NOT NULL DEFAULT '{}'::jsonb,
  facet_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  location_affinity jsonb NOT NULL DEFAULT '{}'::jsonb,
  negative_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  engagement_stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent_embedding vector(1536),
  last_active_at timestamptz,
  profile_version int NOT NULL DEFAULT 1,
  events_processed_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_behavior_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own behavior profile" ON public.user_behavior_profiles;
CREATE POLICY "Users view own behavior profile"
  ON public.user_behavior_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_behavior_profiles_embedding
  ON public.user_behavior_profiles
  USING ivfflat (intent_embedding vector_cosine_ops)
  WITH (lists = 50);

-- ============================================
-- demand_intents
-- ============================================
CREATE TABLE IF NOT EXISTS public.demand_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  query_text text NOT NULL,
  categoria text,
  facets jsonb NOT NULL DEFAULT '{}'::jsonb,
  ubicacion jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  source text NOT NULL DEFAULT 'empty_search'
    CHECK (source IN ('empty_search', 'explicit_seek', 'ai_chat', 'filter_combo')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'fulfilled', 'converted_to_ad', 'expired')),
  converted_adiso_id text REFERENCES public.adisos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days')
);

CREATE INDEX IF NOT EXISTS idx_demand_intents_active
  ON public.demand_intents (status, created_at DESC) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_demand_intents_user
  ON public.demand_intents (user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_demand_intents_embedding
  ON public.demand_intents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

ALTER TABLE public.demand_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own demand intents" ON public.demand_intents;
CREATE POLICY "Users view own demand intents"
  ON public.demand_intents FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- supply_demand_matches
-- ============================================
CREATE TABLE IF NOT EXISTS public.supply_demand_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_intent_id uuid REFERENCES public.demand_intents(id) ON DELETE SET NULL,
  demand_adiso_id text REFERENCES public.adisos(id) ON DELETE SET NULL,
  supply_adiso_id text REFERENCES public.adisos(id) ON DELETE SET NULL,
  supply_draft_hash text,
  match_score float NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'both_paid', 'connected', 'expired', 'notified')),
  notified_at timestamptz,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_demand_supply
  ON public.supply_demand_matches (supply_adiso_id, match_score DESC);

CREATE INDEX IF NOT EXISTS idx_supply_demand_demand
  ON public.supply_demand_matches (demand_intent_id, match_score DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_supply_demand_unique
  ON public.supply_demand_matches (demand_intent_id, supply_adiso_id)
  WHERE demand_intent_id IS NOT NULL AND supply_adiso_id IS NOT NULL;

ALTER TABLE public.supply_demand_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view related supply demand matches" ON public.supply_demand_matches;
CREATE POLICY "Users view related supply demand matches"
  ON public.supply_demand_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.demand_intents di
      WHERE di.id = supply_demand_matches.demand_intent_id AND di.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.adisos a
      WHERE a.id = supply_demand_matches.supply_adiso_id AND a.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.adisos a
      WHERE a.id = supply_demand_matches.demand_adiso_id AND a.user_id = auth.uid()
    )
  );

-- ============================================
-- adiso_package_orders
-- ============================================
CREATE TABLE IF NOT EXISTS public.adiso_package_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adiso_id text REFERENCES public.adisos(id) ON DELETE SET NULL,
  package_tier text NOT NULL
    CHECK (package_tier IN ('miniatura', 'pequeño', 'mediano', 'grande', 'gigante')),
  amount_pen numeric(10, 2) NOT NULL DEFAULT 0 CHECK (amount_pen >= 0),
  currency text NOT NULL DEFAULT 'PEN',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'dev_bypass')),
  draft_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  mp_preference_id text,
  mp_payment_id text,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  interested_users_count int DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_package_orders_user
  ON public.adiso_package_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_package_orders_status
  ON public.adiso_package_orders (status, created_at DESC);

ALTER TABLE public.adiso_package_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own package orders" ON public.adiso_package_orders;
CREATE POLICY "Users view own package orders"
  ON public.adiso_package_orders FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- notification_campaigns + campaign_deliveries
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type text NOT NULL
    CHECK (campaign_type IN ('instant_match', 'demand_fulfilled', 'cross_match', 'system')),
  adiso_id text REFERENCES public.adisos(id) ON DELETE SET NULL,
  advertiser_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.campaign_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.notification_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'in_app'
    CHECK (channel IN ('in_app', 'push', 'email')),
  match_score float,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_user
  ON public.campaign_deliveries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_campaign
  ON public.campaign_deliveries (campaign_id);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own campaign deliveries" ON public.campaign_deliveries;
CREATE POLICY "Users view own campaign deliveries"
  ON public.campaign_deliveries FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Knowledge graph
-- ============================================
CREATE TABLE IF NOT EXISTS public.graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type text NOT NULL,
  ref_id text NOT NULL,
  label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (node_type, ref_id)
);

CREATE TABLE IF NOT EXISTS public.graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id uuid NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  edge_type text NOT NULL,
  weight float NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_from ON public.graph_edges (from_node_id, edge_type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_to ON public.graph_edges (to_node_id, edge_type);

-- ============================================
-- inference_log
-- ============================================
CREATE TABLE IF NOT EXISTS public.inference_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  inference_type text NOT NULL,
  input_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence float,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- User preferences: opportunity notifications opt-in
-- ============================================
ALTER TABLE IF EXISTS public.user_preferences
  ADD COLUMN IF NOT EXISTS oportunidades_personalizadas boolean NOT NULL DEFAULT true;

-- ============================================
-- Helper: upsert graph node
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_upsert_graph_node(
  p_node_type text,
  p_ref_id text,
  p_label text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.graph_nodes (node_type, ref_id, label, metadata)
  VALUES (p_node_type, p_ref_id, p_label, p_metadata)
  ON CONFLICT (node_type, ref_id) DO UPDATE
  SET label = COALESCE(EXCLUDED.label, graph_nodes.label),
      metadata = graph_nodes.metadata || EXCLUDED.metadata
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================
-- fn_match_interested_users
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_match_interested_users(
  p_categoria text,
  p_titulo text,
  p_descripcion text,
  p_ubicacion jsonb DEFAULT '{}'::jsonb,
  p_facets jsonb DEFAULT '{}'::jsonb,
  p_draft_embedding vector(1536) DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  match_score float,
  match_reasons jsonb,
  last_active_at timestamptz,
  contact_channel_preference text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_text text := lower(trim(coalesce(p_titulo, '') || ' ' || coalesce(p_descripcion, '')));
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT DISTINCT ubp.user_id AS uid
    FROM public.user_behavior_profiles ubp
    WHERE ubp.last_active_at > now() - interval '90 days'
    UNION
    SELECT DISTINCT di.user_id AS uid
    FROM public.demand_intents di
    WHERE di.status = 'active'
      AND di.user_id IS NOT NULL
      AND di.expires_at > now()
  ),
  scored AS (
    SELECT
      c.uid,
      (
        CASE
          WHEN p_draft_embedding IS NOT NULL AND ubp.intent_embedding IS NOT NULL THEN
            (1 - (ubp.intent_embedding <=> p_draft_embedding)) * 0.4
          ELSE 0
        END
        + COALESCE((ubp.category_affinity ->> p_categoria)::float, 0) * 0.02 * 0.2
        + CASE
            WHEN EXISTS (
              SELECT 1 FROM public.demand_intents di
              WHERE di.user_id = c.uid AND di.status = 'active'
                AND di.categoria = p_categoria
            ) THEN 0.15 ELSE 0
          END
        + CASE
            WHEN EXISTS (
              SELECT 1 FROM public.demand_intents di
              WHERE di.user_id = c.uid AND di.status = 'active'
                AND lower(di.query_text) LIKE '%' || split_part(search_text, ' ', 1) || '%'
            ) THEN 0.1 ELSE 0
          END
        - COALESCE((ubp.negative_signals ->> p_categoria)::float, 0) * 0.05
      )::float AS score,
      ubp.last_active_at AS active_at,
      jsonb_build_array(
        CASE WHEN (ubp.category_affinity ->> p_categoria)::float > 0
          THEN 'Interés en ' || p_categoria ELSE NULL END,
        CASE WHEN EXISTS (
          SELECT 1 FROM public.demand_intents di
          WHERE di.user_id = c.uid AND di.status = 'active'
        ) THEN 'Búsqueda activa reciente' ELSE NULL END
      ) AS reasons
    FROM candidates c
    LEFT JOIN public.user_behavior_profiles ubp ON ubp.user_id = c.uid
    WHERE c.uid IS NOT NULL
  )
  SELECT
    s.uid,
    LEAST(1.0, GREATEST(0, s.score))::float,
    (
      SELECT jsonb_agg(r) FROM jsonb_array_elements(s.reasons) r WHERE r IS NOT NULL AND r::text != 'null'
    ),
    s.active_at,
    'in_app'::text
  FROM scored s
  WHERE s.score > 0.05
  ORDER BY s.score DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_match_interested_users(text, text, text, jsonb, jsonb, vector, int) TO authenticated, service_role;

-- ============================================
-- fn_match_ads_for_user (recommendations)
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_match_ads_for_user(
  p_user_id uuid,
  p_limit int DEFAULT 12
)
RETURNS TABLE (
  adiso_id text,
  match_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_embedding vector(1536);
  v_categories jsonb;
BEGIN
  SELECT intent_embedding, category_affinity
  INTO v_embedding, v_categories
  FROM public.user_behavior_profiles
  WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT
    a.id,
    (
      CASE WHEN v_embedding IS NOT NULL AND a.embedding IS NOT NULL THEN
        (1 - (a.embedding <=> v_embedding)) * 0.6
      ELSE 0 END
      + COALESCE((v_categories ->> a.categoria::text)::float, 0) * 0.02 * 0.3
      + CASE WHEN a.fecha_publicacion::date >= (current_date - 7) THEN 0.1 ELSE 0 END
    )::float AS score
  FROM public.adisos a
  WHERE a.esta_activo = true
    AND NOT EXISTS (
      SELECT 1 FROM public.user_ad_interactions uai
      WHERE uai.user_id = p_user_id
        AND uai.adiso_id = a.id
        AND uai.interaction_type = 'not_interested'
    )
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_match_ads_for_user(uuid, int) TO authenticated, service_role;

-- ============================================
-- fn_fulfill_package_order
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_fulfill_package_order(p_order_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.adiso_package_orders%ROWTYPE;
  v_adiso_id text;
BEGIN
  SELECT * INTO v_order
  FROM public.adiso_package_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de paquete no encontrada';
  END IF;

  IF v_order.fulfilled_at IS NOT NULL THEN
    RETURN v_order.adiso_id;
  END IF;

  IF v_order.status NOT IN ('paid', 'dev_bypass') THEN
    RAISE EXCEPTION 'Orden no pagada';
  END IF;

  v_adiso_id := v_order.adiso_id;

  UPDATE public.adiso_package_orders
  SET fulfilled_at = now(), updated_at = now()
  WHERE id = p_order_id;

  RETURN v_adiso_id;
END;
$$;

COMMENT ON TABLE public.behavioral_events IS 'Unified behavioral event stream for interest profiling and matching.';
COMMENT ON TABLE public.user_behavior_profiles IS 'Aggregated evolving user behavior profile with intent embedding.';
COMMENT ON TABLE public.demand_intents IS 'Persisted demand signals from searches and seek flows.';

-- Stories Platform v2: visibility, archive, objectives, payments, interactions.

-- Extend stories table
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'draft')),
  ADD COLUMN IF NOT EXISTS visible_until timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'adiso_auto')),
  ADD COLUMN IF NOT EXISTS objective text NOT NULL DEFAULT 'contactos'
    CHECK (objective IN ('ventas', 'clicks', 'contactos')),
  ADD COLUMN IF NOT EXISTS cta_url text;

-- Backfill visible_until from expires_at
UPDATE public.stories
SET visible_until = expires_at
WHERE visible_until IS NULL;

UPDATE public.stories
SET visible_until = created_at + interval '1 hour',
    promotion_tier = 'gratis'
WHERE visible_until IS NULL;

ALTER TABLE public.stories
  ALTER COLUMN visible_until SET NOT NULL;

-- Archive stories past visibility
UPDATE public.stories
SET status = 'archived',
    archived_at = COALESCE(archived_at, visible_until)
WHERE status = 'active' AND visible_until < now();

CREATE INDEX IF NOT EXISTS idx_stories_active_feed
  ON public.stories (status, visible_until DESC, promotion_tier, categoria)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_stories_user_archive
  ON public.stories (user_id, status, created_at DESC);

-- RLS: public sees only active + visible stories; owners see all theirs
DROP POLICY IF EXISTS "Anyone can view active stories" ON public.stories;

CREATE POLICY "Anyone can view active visible stories"
  ON public.stories FOR SELECT
  USING (
    (status = 'active' AND visible_until > now())
    OR auth.uid() = user_id
  );

-- Story promotion orders
CREATE TABLE IF NOT EXISTS public.story_promotion_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('gratis', 'destacada', 'premium')),
  amount_pen numeric(10, 2) NOT NULL DEFAULT 0 CHECK (amount_pen >= 0),
  currency text NOT NULL DEFAULT 'PEN',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'dev_bypass')),
  mp_preference_id text,
  mp_payment_id text,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_story_orders_user ON public.story_promotion_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_orders_story ON public.story_promotion_orders (story_id, created_at DESC);

ALTER TABLE public.story_promotion_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own story orders" ON public.story_promotion_orders;
CREATE POLICY "Users can view own story orders"
  ON public.story_promotion_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Story interactions (analytics)
CREATE TABLE IF NOT EXISTS public.story_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type text NOT NULL
    CHECK (interaction_type IN ('view', 'cta_click', 'whatsapp_click', 'chat_open', 'favorite', 'share')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_interactions_story
  ON public.story_interactions (story_id, interaction_type, created_at DESC);

ALTER TABLE public.story_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert story interactions" ON public.story_interactions;
CREATE POLICY "Anyone can insert story interactions"
  ON public.story_interactions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Story owners can view interactions" ON public.story_interactions;
CREATE POLICY "Story owners can view interactions"
  ON public.story_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.user_id = auth.uid()
    )
  );

-- Story favorites
CREATE TABLE IF NOT EXISTS public.story_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);

ALTER TABLE public.story_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own story favorites" ON public.story_favorites;
CREATE POLICY "Users manage own story favorites"
  ON public.story_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reactivation audit log
CREATE TABLE IF NOT EXISTS public.story_reactivations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL,
  order_id uuid REFERENCES public.story_promotion_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fix view counter RPC (FOUND bug with ON CONFLICT DO NOTHING)
CREATE OR REPLACE FUNCTION public.fn_register_story_view(p_story_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted boolean := false;
BEGIN
  INSERT INTO public.story_views (story_id, user_id)
  VALUES (p_story_id, p_user_id)
  ON CONFLICT (story_id, user_id) DO NOTHING
  RETURNING true INTO v_inserted;

  IF v_inserted THEN
    UPDATE public.stories SET view_count = view_count + 1 WHERE id = p_story_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_register_story_view(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_register_story_view(uuid, uuid) TO authenticated;

-- Fulfill story promotion order
CREATE OR REPLACE FUNCTION public.fn_fulfill_story_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.story_promotion_orders%ROWTYPE;
  v_hours int;
BEGIN
  SELECT * INTO v_order
  FROM public.story_promotion_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de historia no encontrada';
  END IF;

  IF v_order.fulfilled_at IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_order.status NOT IN ('paid', 'dev_bypass') THEN
    RAISE EXCEPTION 'La orden no está pagada (estado: %)', v_order.status;
  END IF;

  v_hours := CASE v_order.tier
    WHEN 'premium' THEN 48
    WHEN 'destacada' THEN 24
    ELSE 1
  END;

  UPDATE public.stories
  SET promotion_tier = v_order.tier,
      status = 'active',
      visible_until = now() + (v_hours || ' hours')::interval,
      expires_at = now() + (v_hours || ' hours')::interval,
      archived_at = NULL
  WHERE id = v_order.story_id AND user_id = v_order.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Historia no encontrada o no autorizado';
  END IF;

  UPDATE public.story_promotion_orders
  SET fulfilled_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.story_reactivations (story_id, user_id, tier, order_id)
  VALUES (v_order.story_id, v_order.user_id, v_order.tier, p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_fulfill_story_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_fulfill_story_order(uuid) TO service_role;

-- Archive expired active stories (cron)
CREATE OR REPLACE FUNCTION public.fn_archive_expired_stories()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.stories
  SET status = 'archived',
      archived_at = now()
  WHERE status = 'active'
    AND visible_until < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_archive_expired_stories() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_archive_expired_stories() TO service_role;

-- Conversation context for stories
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL;

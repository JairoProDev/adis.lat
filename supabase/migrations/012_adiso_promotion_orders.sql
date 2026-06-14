-- Órdenes de promoción de anuncios: registro de pago y cumplimiento seguro.
-- La promoción pagada solo se aplica vía fn_fulfill_promotion_order (service role).

CREATE TABLE IF NOT EXISTS public.adiso_promotion_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adiso_id text NOT NULL REFERENCES public.adisos(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('gratis', 'destacada', 'premium')),
  days int NOT NULL CHECK (days >= 0 AND days <= 90),
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

CREATE INDEX IF NOT EXISTS idx_promotion_orders_user
  ON public.adiso_promotion_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotion_orders_adiso
  ON public.adiso_promotion_orders (adiso_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotion_orders_status
  ON public.adiso_promotion_orders (status, created_at DESC);

ALTER TABLE public.adiso_promotion_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own promotion orders" ON public.adiso_promotion_orders;
CREATE POLICY "Users can view own promotion orders"
  ON public.adiso_promotion_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el service role inserta/actualiza órdenes (vía API del servidor).

CREATE OR REPLACE FUNCTION public.trg_adiso_promotion_orders_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adiso_promotion_orders_updated
  ON public.adiso_promotion_orders;
CREATE TRIGGER trg_adiso_promotion_orders_updated
  BEFORE UPDATE ON public.adiso_promotion_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_adiso_promotion_orders_set_updated_at();

-- Cumple una orden pagada: valida estado y aplica la promoción al anuncio.
CREATE OR REPLACE FUNCTION public.fn_fulfill_promotion_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.adiso_promotion_orders%ROWTYPE;
  v_rank smallint;
BEGIN
  SELECT * INTO v_order
  FROM public.adiso_promotion_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de promoción no encontrada';
  END IF;

  IF v_order.fulfilled_at IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_order.status NOT IN ('paid', 'dev_bypass') THEN
    RAISE EXCEPTION 'La orden no está pagada (estado: %)', v_order.status;
  END IF;

  v_rank := CASE v_order.tier
    WHEN 'premium' THEN 2
    WHEN 'destacada' THEN 1
    ELSE 0
  END;

  UPDATE public.adisos
  SET promotion_tier = v_order.tier,
      promotion_rank = v_rank,
      promotion_expires_at = CASE
        WHEN v_order.tier = 'gratis' THEN NULL
        ELSE now() + (v_order.days || ' days')::interval
      END
  WHERE id = v_order.adiso_id AND user_id = v_order.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No autorizado o anuncio no encontrado';
  END IF;

  UPDATE public.adiso_promotion_orders
  SET fulfilled_at = now()
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_fulfill_promotion_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_fulfill_promotion_order(uuid) TO service_role;

-- Quitar promoción directa desde el cliente autenticado (solo vía API + service role).
REVOKE EXECUTE ON FUNCTION public.fn_promote_adiso(text, uuid, text, int) FROM authenticated;

COMMENT ON TABLE public.adiso_promotion_orders IS
  'Órdenes de promoción de anuncios. Las promociones pagadas se aplican solo tras confirmar pago.';

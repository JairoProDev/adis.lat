-- Promoted listings: paid tiers so sellers' adisos appear first in
-- search/feed results, mirroring the Stories promotion tiers
-- (gratis / destacada / premium).

ALTER TABLE adisos
  ADD COLUMN IF NOT EXISTS promotion_tier text NOT NULL DEFAULT 'gratis'
    CHECK (promotion_tier IN ('gratis', 'destacada', 'premium')),
  ADD COLUMN IF NOT EXISTS promotion_rank smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promotion_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_adisos_promotion
  ON adisos (promotion_rank DESC, fecha_publicacion DESC);

-- Lazily resets promotions that already expired. Called before reading the
-- feed so ordering stays correct without needing a scheduled job.
CREATE OR REPLACE FUNCTION fn_clear_expired_promotions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE adisos
  SET promotion_tier = 'gratis',
      promotion_rank = 0,
      promotion_expires_at = NULL
  WHERE promotion_expires_at IS NOT NULL
    AND promotion_expires_at < now()
    AND promotion_tier <> 'gratis';
$$;

GRANT EXECUTE ON FUNCTION fn_clear_expired_promotions() TO authenticated, anon;

-- Promotes an adiso owned by the caller to the given tier for p_days days.
CREATE OR REPLACE FUNCTION fn_promote_adiso(
  p_adiso_id text,
  p_user_id uuid,
  p_tier text,
  p_days int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rank smallint;
BEGIN
  IF p_tier NOT IN ('gratis', 'destacada', 'premium') THEN
    RAISE EXCEPTION 'Tier de promoción inválido: %', p_tier;
  END IF;

  v_rank := CASE p_tier
    WHEN 'premium' THEN 2
    WHEN 'destacada' THEN 1
    ELSE 0
  END;

  UPDATE adisos
  SET promotion_tier = p_tier,
      promotion_rank = v_rank,
      promotion_expires_at = CASE
        WHEN p_tier = 'gratis' THEN NULL
        ELSE now() + (p_days || ' days')::interval
      END
  WHERE id = p_adiso_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No autorizado o anuncio no encontrado';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_promote_adiso(text, uuid, text, int) TO authenticated;

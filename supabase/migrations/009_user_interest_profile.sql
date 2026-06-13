-- User interest profile: aggregated signals derived from favorite / "not interested"
-- interactions, used to personalize ranking and recommendations.

ALTER TABLE IF EXISTS public.user_ad_interactions
  ADD COLUMN IF NOT EXISTS reason text;

CREATE TABLE IF NOT EXISTS public.user_interest_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  keyword_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismiss_reasons jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_interest_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own interest profile" ON public.user_interest_profile;
CREATE POLICY "Users can view own interest profile"
  ON public.user_interest_profile FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interest profile" ON public.user_interest_profile;
CREATE POLICY "Users can insert own interest profile"
  ON public.user_interest_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interest profile" ON public.user_interest_profile;
CREATE POLICY "Users can update own interest profile"
  ON public.user_interest_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- Atomically records a like (+1) or dismiss (-1) signal: bumps the category
-- affinity score, bumps each keyword's affinity score, and (for dismissals)
-- increments the counter for the given reason.
CREATE OR REPLACE FUNCTION public.fn_record_interest_signal(
  p_user_id uuid,
  p_categoria text,
  p_keywords text[],
  p_delta int,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kw text;
BEGIN
  INSERT INTO public.user_interest_profile (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_interest_profile
  SET
    categoria_signals = jsonb_set(
      categoria_signals,
      ARRAY[p_categoria],
      to_jsonb(COALESCE((categoria_signals ->> p_categoria)::int, 0) + p_delta)
    ),
    dismiss_reasons = CASE
      WHEN p_reason IS NOT NULL THEN jsonb_set(
        dismiss_reasons,
        ARRAY[p_reason],
        to_jsonb(COALESCE((dismiss_reasons ->> p_reason)::int, 0) + 1)
      )
      ELSE dismiss_reasons
    END,
    updated_at = now()
  WHERE user_id = p_user_id;

  IF p_keywords IS NOT NULL THEN
    FOREACH kw IN ARRAY p_keywords LOOP
      UPDATE public.user_interest_profile
      SET keyword_signals = jsonb_set(
        keyword_signals,
        ARRAY[kw],
        to_jsonb(COALESCE((keyword_signals ->> kw)::int, 0) + p_delta)
      )
      WHERE user_id = p_user_id;
    END LOOP;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_record_interest_signal(uuid, text, text[], int, text) TO authenticated;

COMMENT ON TABLE public.user_interest_profile IS 'Aggregated per-user signals (category affinity, keyword affinity, dismiss reasons) derived from favorite/dismiss interactions, used to personalize ranking and recommendations.';

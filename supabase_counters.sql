-- Add counter columns to adisos table if they don't exist
ALTER TABLE public.adisos ADD COLUMN IF NOT EXISTS vistas BIGINT DEFAULT 0;
ALTER TABLE public.adisos ADD COLUMN IF NOT EXISTS contactos BIGINT DEFAULT 0;

-- Function to increment view count (Atomic increment)
CREATE OR REPLACE FUNCTION increment_view(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.adisos
  SET vistas = COALESCE(vistas, 0) + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment contact count (Atomic increment)
CREATE OR REPLACE FUNCTION increment_contact(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.adisos
  SET contactos = COALESCE(contactos, 0) + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to public (so guests can increment counters)
GRANT EXECUTE ON FUNCTION increment_view(UUID) TO public;
GRANT EXECUTE ON FUNCTION increment_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION increment_contact(UUID) TO public;
GRANT EXECUTE ON FUNCTION increment_contact(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_contact(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_contact(UUID) TO service_role;

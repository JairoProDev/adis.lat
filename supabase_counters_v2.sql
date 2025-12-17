-- 1. CLEANUP: Drop incorrect functions if they exist (handling both UUID and TEXT versions to be safe)
DROP FUNCTION IF EXISTS increment_view(UUID);
DROP FUNCTION IF EXISTS increment_view(TEXT);
DROP FUNCTION IF EXISTS increment_contact(UUID);
DROP FUNCTION IF EXISTS increment_contact(TEXT);

-- 2. COLUMNS: Ensure columns exist in adisos
ALTER TABLE public.adisos ADD COLUMN IF NOT EXISTS vistas BIGINT DEFAULT 0;
ALTER TABLE public.adisos ADD COLUMN IF NOT EXISTS contactos BIGINT DEFAULT 0;

-- 3. FUNCTIONS: Re-create with TEXT parameter (to match your short IDs like "1rExP2TOlc")
CREATE OR REPLACE FUNCTION increment_view(ad_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.adisos
  SET vistas = COALESCE(vistas, 0) + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_contact(ad_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.adisos
  SET contactos = COALESCE(contactos, 0) + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PERMISSIONS: Grant execute to everyone (including guests)
GRANT EXECUTE ON FUNCTION increment_view(TEXT) TO public, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_contact(TEXT) TO public, anon, authenticated, service_role;

-- 5. ANALYTICS TABLE: Create user_analytics if missing (fixes the 401 error)
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Can be null for guests
    tipo_evento TEXT NOT NULL,
    evento TEXT NOT NULL,
    datos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ANALYTICS SECURITY: Enable RLS and allow inserts from everyone
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone (guest or logged in) to insert analytics
CREATE POLICY "Public analytics insert" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view only their own analytics (optional, for safety)
CREATE POLICY "Users view own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- 7. INDEXES: For performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON public.user_analytics(created_at);

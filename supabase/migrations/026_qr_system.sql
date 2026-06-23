-- QR dinámico: códigos cortos, escaneos y tier de suscripción

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL UNIQUE,
  destination_type TEXT NOT NULL DEFAULT 'profile'
    CHECK (destination_type IN ('profile', 'url', 'whatsapp')),
  destination_slug TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  style_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (style_tier IN ('free', 'pro')),
  style_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  scan_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON qr_codes (short_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business ON qr_codes (business_profile_id);

CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  session_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_qr_scans_code_date ON qr_scans (qr_code_id, scanned_at DESC);

-- Suscripciones Pro (MercadoPago)
CREATE TABLE IF NOT EXISTS business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'pro' CHECK (tier IN ('pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  external_order_id TEXT UNIQUE,
  amount_pen NUMERIC(10, 2) NOT NULL DEFAULT 29.00,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business
  ON business_subscriptions (business_profile_id, status);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;

-- Lectura pública del mapping corto (solo campos necesarios para redirect)
DROP POLICY IF EXISTS "qr_codes_public_read" ON qr_codes;
CREATE POLICY "qr_codes_public_read" ON qr_codes
  FOR SELECT USING (is_active = true);

-- Miembros del negocio gestionan su QR
DROP POLICY IF EXISTS "qr_codes_member_all" ON qr_codes;
CREATE POLICY "qr_codes_member_all" ON qr_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_profile_id = qr_codes.business_profile_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "qr_scans_member_read" ON qr_scans;
CREATE POLICY "qr_scans_member_read" ON qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM qr_codes qc
      JOIN business_members bm ON bm.business_profile_id = qc.business_profile_id
      WHERE qc.id = qr_scans.qr_code_id
        AND bm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "business_subscriptions_member_read" ON business_subscriptions;
CREATE POLICY "business_subscriptions_member_read" ON business_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_members bm
      WHERE bm.business_profile_id = business_subscriptions.business_profile_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
    )
  );

COMMENT ON TABLE qr_codes IS 'QR dinámico por negocio — URL corta buscadis.com/q/{short_code}';
COMMENT ON TABLE qr_scans IS 'Telemetría de escaneos QR';
COMMENT ON TABLE business_subscriptions IS 'Suscripción Pro/Enterprise vía MercadoPago';

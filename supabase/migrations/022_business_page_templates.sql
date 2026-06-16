-- Business page templates (Phase 2)
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'modern_tabs',
  ADD COLUMN IF NOT EXISTS theme_preset TEXT DEFAULT 'executive',
  ADD COLUMN IF NOT EXISTS template_applied_at TIMESTAMPTZ;

COMMENT ON COLUMN business_profiles.template_id IS 'Page layout template from templates registry';
COMMENT ON COLUMN business_profiles.theme_preset IS 'Curated theme preset key';

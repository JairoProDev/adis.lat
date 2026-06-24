ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT '#ffc24a';

COMMENT ON COLUMN public.business_profiles.theme_accent_color IS 'Secondary brand color (accent) for profile theming';

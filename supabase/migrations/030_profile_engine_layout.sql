-- Profile engine: layout, style, banner canvas config, metrics, highlights, hashtags

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS profile_layout JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_style JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_config JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metrics_config JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS story_highlights JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_hashtags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location_display_level TEXT DEFAULT 'city';

COMMENT ON COLUMN public.business_profiles.profile_layout IS 'Profile engine structure: slots, template id, background';
COMMENT ON COLUMN public.business_profiles.profile_style IS 'Profile engine style skin and per-component overrides';
COMMENT ON COLUMN public.business_profiles.banner_config IS 'Banner: image, text overlay, or canvas (phase 2)';
COMMENT ON COLUMN public.business_profiles.metrics_config IS 'Selected metric keys to display (max 3)';
COMMENT ON COLUMN public.business_profiles.story_highlights IS 'Instagram-style story highlights';
COMMENT ON COLUMN public.business_profiles.profile_hashtags IS 'Profile hashtag keywords';
COMMENT ON COLUMN public.business_profiles.location_display_level IS 'address|district|city|region|country';

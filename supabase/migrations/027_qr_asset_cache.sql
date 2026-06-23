-- Cache de PNG generados (evita regenerar en cada request)

ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS asset_hash TEXT,
  ADD COLUMN IF NOT EXISTS cached_png_path TEXT;

COMMENT ON COLUMN qr_codes.asset_hash IS 'Hash del estilo+tier; invalida cache al personalizar';
COMMENT ON COLUMN qr_codes.cached_png_path IS 'Ruta en Storage bucket qr-assets';

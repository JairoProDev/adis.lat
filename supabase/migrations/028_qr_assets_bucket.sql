-- Bucket privado para PNG cacheados de QR (lectura/escritura vía service role en API)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-assets',
  'qr-assets',
  false,
  5242880,
  ARRAY['image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

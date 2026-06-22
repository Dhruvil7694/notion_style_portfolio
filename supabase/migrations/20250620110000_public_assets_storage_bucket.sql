-- Migration: public_assets_storage_bucket
-- Description: Public bucket for project cover images and site assets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public assets are publicly accessible" ON storage.objects;

CREATE POLICY "Public assets are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public-assets');

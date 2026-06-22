-- Allow public read of about_content settings key
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;

CREATE POLICY "settings_public_read"
  ON public.settings
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN ('site_settings', 'social_links', 'contact_info', 'about_content')
  );

COMMENT ON POLICY "settings_public_read" ON public.settings IS
  'Public can read site_settings, social_links, contact_info, and about_content';

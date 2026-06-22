import { getPublicSettings } from "@/lib/public/queries"
import { SEO_SITE_TITLE } from "@/lib/seo/constants"
import { createOgImageResponse, ogImageRouteConfig } from "@/lib/seo/og-image"

export const alt = ogImageRouteConfig.alt
export const size = ogImageRouteConfig.size
export const contentType = ogImageRouteConfig.contentType

export default async function Image() {
  const settings = await getPublicSettings()

  return createOgImageResponse({
    title: settings.site.owner_name || SEO_SITE_TITLE,
    eyebrow: settings.site.owner_title || "Applied AI Engineer",
  })
}

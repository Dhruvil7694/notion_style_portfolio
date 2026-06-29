import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { SEO_SITE_TITLE } from "@/features/seo/lib/constants"
import {
  createOgImageResponse,
  ogImageRouteConfig,
} from "@/features/seo/lib/og-image"

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

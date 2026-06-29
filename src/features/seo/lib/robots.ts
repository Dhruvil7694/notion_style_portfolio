import "server-only"

import type { MetadataRoute } from "next"

import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import { buildSitemapUrl } from "@/features/seo/lib/sitemap"

export async function buildRobots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/projects",
          "/research",
          "/blog",
          "/automations",
          "/ai-first",
          "/experience",
          "/contact",
          "/privacy",
          "/resume",
          "/about",
          "/expertise",
          "/technology",
          "/concept",
          "/stack",
          "/explore",
          "/search",
        ],
        disallow: ["/admin", "/admin/"],
      },
    ],
    ...(siteUrl ? { sitemap: buildSitemapUrl(siteUrl) } : {}),
  }
}

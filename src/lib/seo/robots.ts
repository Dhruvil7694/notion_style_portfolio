import "server-only"

import type { MetadataRoute } from "next"

import { getPublicSettings } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"
import { buildSitemapUrl } from "@/lib/seo/sitemap"

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

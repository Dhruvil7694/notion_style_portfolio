import type { MetadataRoute } from "next"

import { buildSitemap } from "@/lib/seo/sitemap"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap()
}

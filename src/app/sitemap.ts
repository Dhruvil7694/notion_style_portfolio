import type { MetadataRoute } from "next"

import { PUBLIC_CACHE_REVALIDATE_SECONDS } from "@/lib/public/cache-tags"
import { buildSitemap } from "@/lib/seo/sitemap"

export const revalidate = PUBLIC_CACHE_REVALIDATE_SECONDS

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap()
}

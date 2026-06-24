import type { MetadataRoute } from "next"

import { PUBLIC_CACHE_REVALIDATE_SECONDS } from "@/lib/public/cache-tags"
import { buildRobots } from "@/lib/seo/robots"

export const revalidate = PUBLIC_CACHE_REVALIDATE_SECONDS

export default async function robots(): Promise<MetadataRoute.Robots> {
  return buildRobots()
}

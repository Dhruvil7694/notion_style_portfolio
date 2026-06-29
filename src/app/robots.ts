import type { MetadataRoute } from "next"

import { buildRobots } from "@/features/seo/lib/robots"

export default async function robots(): Promise<MetadataRoute.Robots> {
  return buildRobots()
}

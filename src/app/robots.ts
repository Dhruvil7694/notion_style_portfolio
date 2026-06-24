import type { MetadataRoute } from "next"

import { buildRobots } from "@/lib/seo/robots"

export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  return buildRobots()
}

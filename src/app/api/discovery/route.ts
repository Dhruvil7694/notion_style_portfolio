import { NextResponse } from "next/server"

import { buildDiscoveryIndex } from "@/features/discovery/lib/indexer"
import { searchDocumentsGrouped } from "@/features/discovery/lib/search"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import { rateLimitRequest } from "@/shared/lib/security/api-route"

export const revalidate = 3600

const DISCOVERY_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400"

export async function GET(request: Request) {
  const rateLimit = await rateLimitRequest(request, "discovery")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  if (!siteUrl) {
    return NextResponse.json(
      { documents: [], generatedAt: new Date().toISOString(), results: [] },
      {
        status: 200,
        headers: {
          ...rateLimit.headers,
          "Cache-Control": DISCOVERY_CACHE_CONTROL,
        },
      }
    )
  }

  const index = await buildDiscoveryIndex(siteUrl)
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""

  if (query) {
    const results = searchDocumentsGrouped(index.documents, query, {
      limit: 40,
    })
    return NextResponse.json(
      {
        documents: index.documents,
        generatedAt: index.generatedAt,
        query,
        results,
      },
      {
        headers: {
          ...rateLimit.headers,
          "Cache-Control": DISCOVERY_CACHE_CONTROL,
        },
      }
    )
  }

  return NextResponse.json(index, {
    headers: {
      ...rateLimit.headers,
      "Cache-Control": DISCOVERY_CACHE_CONTROL,
    },
  })
}

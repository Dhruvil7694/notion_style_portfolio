import { NextResponse } from "next/server"

import { buildKnowledgeGraph } from "@/lib/knowledge/graph"
import { getPublicSettings } from "@/lib/public/queries"
import { rateLimitRequest } from "@/lib/security/api-route"
import { resolveSiteUrl } from "@/lib/seo/canonical"

export const revalidate = 3600

const KNOWLEDGE_GRAPH_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400"

export async function GET(request: Request) {
  const rateLimit = await rateLimitRequest(request, "knowledgeGraph")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const graph = await buildKnowledgeGraph(siteUrl)

  if (!graph) {
    return NextResponse.json(
      { entities: [], relationships: [], expertise: [], technologies: [], concepts: [] },
      {
        status: 200,
        headers: {
          ...rateLimit.headers,
          "Cache-Control": KNOWLEDGE_GRAPH_CACHE_CONTROL,
        },
      }
    )
  }

  return NextResponse.json(
    {
      entities: graph.entities,
      relationships: graph.relationships,
      expertise: graph.expertise,
      technologies: graph.technologies,
      concepts: graph.concepts,
    },
    {
      headers: {
        ...rateLimit.headers,
        "Cache-Control": KNOWLEDGE_GRAPH_CACHE_CONTROL,
      },
    }
  )
}

import { NextResponse } from "next/server"

import { buildKnowledgeGraph } from "@/features/knowledge-base/lib/graph"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import { rateLimitRequest } from "@/shared/lib/security/api-route"

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
      {
        entities: [],
        relationships: [],
        expertise: [],
        technologies: [],
        concepts: [],
      },
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

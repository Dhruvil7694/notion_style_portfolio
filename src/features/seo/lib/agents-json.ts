import "server-only"

import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { generateCanonicalUrl } from "@/features/seo/lib/canonical"

type AgentsJsonParameterSchema = {
  type: "object"
  properties: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "array" | "object"
      description?: string
      format?: string
      enum?: string[]
    }
  >
  required?: string[]
  additionalProperties?: boolean
}

export type AgentsJsonAction = {
  id: string
  name: string
  description: string
  method: "GET" | "POST"
  url: string
  parameters: AgentsJsonParameterSchema
}

export type AgentsJsonManifest = {
  schema_version: string
  name: string
  homepage: string
  description: string
  actions: AgentsJsonAction[]
}

function objectParameters(
  properties: AgentsJsonParameterSchema["properties"],
  required?: string[]
): AgentsJsonParameterSchema {
  return {
    type: "object",
    properties,
    ...(required && required.length > 0 ? { required } : {}),
  }
}

export function buildAgentsJson(
  siteUrl: string,
  settings: PublicSettings
): AgentsJsonManifest {
  const ownerName = settings.site.owner_name?.trim() || "Dhruvil Patel"
  const homepage = generateCanonicalUrl(siteUrl, "/")
  const description =
    settings.site.site_description?.trim() ||
    "Applied AI Engineer portfolio with projects, research, writing, automations, and a machine-readable knowledge graph."

  return {
    schema_version: "0.1",
    name: ownerName,
    homepage,
    description,
    actions: [
      {
        id: "search_site",
        name: "Search site",
        description:
          "Search published projects, research, writing, automations, expertise, and technology pages.",
        method: "GET",
        url: generateCanonicalUrl(siteUrl, "/api/discovery"),
        parameters: objectParameters(
          {
            q: {
              type: "string",
              description: "Free-text search query",
            },
          },
          ["q"]
        ),
      },
      {
        id: "browse_projects",
        name: "Browse projects",
        description: "List production AI systems and case studies.",
        method: "GET",
        url: generateCanonicalUrl(siteUrl, "/projects"),
        parameters: objectParameters({}),
      },
      {
        id: "browse_expertise",
        name: "Browse expertise",
        description: "List expertise authority pages and related work.",
        method: "GET",
        url: generateCanonicalUrl(siteUrl, "/expertise"),
        parameters: objectParameters({}),
      },
      {
        id: "view_contact",
        name: "View contact",
        description:
          "Open the contact page for collaboration or hiring inquiries.",
        method: "GET",
        url: generateCanonicalUrl(siteUrl, "/contact"),
        parameters: objectParameters({}),
      },
      {
        id: "view_privacy",
        name: "View privacy policy",
        description:
          "Read analytics, monitoring, and AI assistant data practices.",
        method: "GET",
        url: generateCanonicalUrl(siteUrl, "/privacy"),
        parameters: objectParameters({}),
      },
      {
        id: "knowledge_graph",
        name: "Export knowledge graph",
        description:
          "Fetch the machine-readable knowledge graph linking projects, expertise, technologies, and content.",
        method: "GET",
        url: generateCanonicalUrl(siteUrl, "/api/knowledge-graph"),
        parameters: objectParameters({}),
      },
    ],
  }
}

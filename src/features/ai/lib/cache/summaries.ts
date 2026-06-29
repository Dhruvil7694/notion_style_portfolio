import "server-only"

import { unstable_cache } from "next/cache"

import { auditPortfolio } from "@/features/copilot/lib/audit"
import { buildCopilotToolDescriptions } from "@/features/copilot/lib/tools"
import { buildKnowledgeGraph } from "@/features/knowledge-base/lib/graph"

const CACHE_TTL = 600

export async function getCachedPortfolioSnapshot(
  siteUrl: string
): Promise<string> {
  return unstable_cache(
    async () => {
      const graph = await buildKnowledgeGraph(siteUrl)
      if (!graph) return "Portfolio snapshot unavailable."

      let healthScore = "N/A"
      try {
        const audit = await auditPortfolio()
        healthScore = `${audit.score}%`
      } catch (err) {
        console.error("[ai-cache] portfolio audit failed:", err)
      }

      return [
        "# Portfolio Snapshot",
        `Projects: ${graph.entities.filter((e) => e.type === "project").length}`,
        `Research: ${graph.entities.filter((e) => e.type === "research").length}`,
        `Writing: ${graph.entities.filter((e) => e.type === "writing").length}`,
        `Automations: ${graph.entities.filter((e) => e.type === "automation").length}`,
        `Technologies: ${graph.technologies.length}`,
        `Concepts: ${graph.concepts.length}`,
        `Expertise Areas: ${graph.expertise.length}`,
        `Health Score: ${healthScore}`,
      ].join("\n")
    },
    ["portfolio-snapshot", siteUrl],
    { revalidate: CACHE_TTL, tags: ["ai-cache-portfolio-snapshot"] }
  )()
}

export async function getCachedKnowledgeSummary(
  siteUrl: string
): Promise<string> {
  return unstable_cache(
    async () => {
      const graph = await buildKnowledgeGraph(siteUrl)
      if (!graph) return ""

      const topExpertise = graph.expertise
        .slice(0, 5)
        .map((e) => e.title)
        .join(", ")
      const topTech = graph.technologies
        .slice(0, 8)
        .map((t) => t.name)
        .join(", ")
      const topConcepts = graph.concepts
        .slice(0, 8)
        .map((c) => c.title)
        .join(", ")

      return [
        "# Knowledge Summary",
        `Relationships: ${graph.relationships.length}`,
        `Top expertise: ${topExpertise || "none"}`,
        `Top technologies: ${topTech || "none"}`,
        `Top concepts: ${topConcepts || "none"}`,
      ].join("\n")
    },
    ["knowledge-summary", siteUrl],
    { revalidate: CACHE_TTL, tags: ["ai-cache-knowledge-summary"] }
  )()
}

export async function getCachedToolSummary(): Promise<string> {
  return unstable_cache(
    async () => {
      const tools = await buildCopilotToolDescriptions()
      return `# Available Copilot Tools\n${tools}`
    },
    ["tool-summary"],
    { revalidate: CACHE_TTL, tags: ["ai-cache-tool-summary"] }
  )()
}

export async function getCachedExpertiseSummary(
  siteUrl: string
): Promise<string> {
  return unstable_cache(
    async () => {
      const graph = await buildKnowledgeGraph(siteUrl)
      if (!graph) return ""
      return graph.expertise
        .slice(0, 10)
        .map(
          (area) => `- ${area.title}: ${area.description ?? area.summary ?? ""}`
        )
        .join("\n")
    },
    ["expertise-summary", siteUrl],
    { revalidate: CACHE_TTL, tags: ["ai-cache-expertise-summary"] }
  )()
}

export async function getCachedTechnologySummary(
  siteUrl: string
): Promise<string> {
  return unstable_cache(
    async () => {
      const graph = await buildKnowledgeGraph(siteUrl)
      if (!graph) return ""
      return graph.technologies
        .slice(0, 15)
        .map(
          (tech) => `- ${tech.name}${tech.registered ? " (registered)" : ""}`
        )
        .join("\n")
    },
    ["technology-summary", siteUrl],
    { revalidate: CACHE_TTL, tags: ["ai-cache-technology-summary"] }
  )()
}

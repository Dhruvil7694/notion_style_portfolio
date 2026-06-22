import "server-only"

import { getAdminMutationClient } from "@/lib/admin/actions/client"
import { buildKnowledgeGraph } from "@/lib/knowledge/graph"
import { normalizeConceptSlug } from "@/lib/knowledge/scoring"
import { normalizeTechnologySlug } from "@/lib/knowledge/taxonomy"
import { getPublicSettings } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"

import { auditProject } from "./project-audit"
import type { PortfolioHealthReport, PortfolioIssue, RelationshipSuggestion } from "./types"

export async function auditPortfolio(): Promise<PortfolioHealthReport> {
  const supabase = await getAdminMutationClient()
  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id, slug, title, overview, problem, why_built, architecture, architecture_nodes, ai_design, ai_design_nodes, faq, key_takeaways, project_facts, tech_stack, technologies, expertise_slugs, concepts, tradeoffs, ai_summary, status"
    )

  if (error) {
    throw new Error(`Failed to audit portfolio: ${error.message}`)
  }

  const projectReports = (projects ?? []).map((project) => auditProject(project))
  const portfolioIssues: PortfolioIssue[] = []

  for (const report of projectReports) {
    if (report.missing.includes("FAQ")) {
      portfolioIssues.push({
        type: "missing_faq",
        message: `${report.title} is missing FAQs`,
        entitySlug: report.slug,
        entityTitle: report.title,
      })
    }
    if (report.missing.includes("Architecture")) {
      portfolioIssues.push({
        type: "missing_architecture",
        message: `${report.title} is missing architecture description`,
        entitySlug: report.slug,
        entityTitle: report.title,
      })
    }
    if (report.missing.includes("AI Summary")) {
      portfolioIssues.push({
        type: "missing_ai_summary",
        message: `${report.title} is missing AI summary`,
        entitySlug: report.slug,
        entityTitle: report.title,
      })
    }
    if (report.missing.includes("Tradeoffs")) {
      portfolioIssues.push({
        type: "missing_tradeoffs",
        message: `${report.title} is missing tradeoffs`,
        entitySlug: report.slug,
        entityTitle: report.title,
      })
    }
  }

  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  if (siteUrl) {
    const graph = await buildKnowledgeGraph(siteUrl)
    if (graph) {
      const linkedTechSlugs = new Set<string>()
    for (const project of projects ?? []) {
      for (const tech of [...(project.tech_stack ?? []), ...(project.technologies ?? [])]) {
        linkedTechSlugs.add(normalizeTechnologySlug(tech))
      }
    }

    for (const tech of graph.technologies) {
      if (!linkedTechSlugs.has(tech.slug) && tech.registered) {
        portfolioIssues.push({
          type: "unlinked_technology",
          message: `Technology "${tech.name}" is registered but not linked to any project`,
          entitySlug: tech.slug,
          entityTitle: tech.name,
        })
      }
    }

    const techNameMap = new Map<string, string>()
    for (const tech of graph.technologies) {
      techNameMap.set(normalizeTechnologySlug(tech.slug), tech.name)
    }

    const duplicateTechs = findDuplicates([...techNameMap.values()])
    for (const name of duplicateTechs) {
      portfolioIssues.push({
        type: "duplicate_technology",
        message: `Possible duplicate technology: "${name}"`,
        entityTitle: name,
      })
    }

    const conceptTitles = graph.concepts.map((c) => c.title)
    for (const title of findDuplicates(conceptTitles)) {
      portfolioIssues.push({
        type: "duplicate_concept",
        message: `Possible duplicate concept: "${title}"`,
        entityTitle: title,
      })
    }
    }
  }

  const avgScore =
    projectReports.length > 0
      ? Math.round(
          projectReports.reduce((sum, report) => sum + report.score, 0) / projectReports.length
        )
      : 0

  return {
    score: avgScore,
    projectCount: projectReports.length,
    projects: projectReports,
    portfolioIssues,
  }
}

function findDuplicates(items: string[]): string[] {
  const seen = new Map<string, number>()
  const duplicates: string[] = []

  for (const item of items) {
    const key = item.toLowerCase().trim()
    const count = (seen.get(key) ?? 0) + 1
    seen.set(key, count)
    if (count === 2) {
      duplicates.push(item)
    }
  }

  return duplicates
}

export async function suggestRelationships(
  entityType: "project" | "technology" | "concept" | "skill",
  entitySlug: string
): Promise<RelationshipSuggestion[]> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  if (!siteUrl) return []

  const graph = await buildKnowledgeGraph(siteUrl)
  if (!graph) return []
  const suggestions: RelationshipSuggestion[] = []

  if (entityType === "technology" || entityType === "skill") {
    const normalized = normalizeTechnologySlug(entitySlug)
    const linkedProjects = graph.entities.filter(
      (entity) =>
        entity.type === "project" &&
        graph.relationships.some(
          (rel) =>
            rel.type === "uses_technology" &&
            rel.targetId === `technology:${normalized}` &&
            rel.sourceId === entity.id
        )
    )

    for (const project of linkedProjects) {
      suggestions.push({
        type: "link_project",
        entityType: "project",
        entitySlug: project.slug,
        entityTitle: project.title,
        suggestedSlug: normalized,
        suggestedTitle: entitySlug,
        reason: `${project.title} uses ${entitySlug} in its tech stack`,
        confidence: "high",
      })
    }
  }

  if (entityType === "concept") {
    const normalized = normalizeConceptSlug(entitySlug)
    const linkedProjects = graph.entities.filter(
      (entity) =>
        entity.type === "project" &&
        graph.relationships.some(
          (rel) =>
            rel.type === "mentions_concept" &&
            rel.targetId === `concept:${normalized}` &&
            rel.sourceId === entity.id
        )
    )

    for (const project of linkedProjects) {
      suggestions.push({
        type: "add_concept",
        entityType: "project",
        entitySlug: project.slug,
        entityTitle: project.title,
        suggestedSlug: normalized,
        suggestedTitle: entitySlug,
        reason: `${project.title} mentions concept ${entitySlug}`,
        confidence: "medium",
      })
    }
  }

  return suggestions
}

export { auditProject }

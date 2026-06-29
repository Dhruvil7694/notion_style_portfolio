import "server-only"

import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { generateCanonicalUrl } from "@/features/seo/lib/canonical"

function llmsLink(
  siteUrl: string,
  path: string,
  label: string,
  note?: string
): string {
  const url = generateCanonicalUrl(siteUrl, path)
  return note ? `- [${label}](${url}): ${note}` : `- [${label}](${url})`
}

export function buildLlmsTxt(
  siteUrl: string,
  settings: PublicSettings
): string {
  const ownerName = settings.site.owner_name?.trim() || "Portfolio Owner"
  const ownerTitle = settings.site.owner_title?.trim() || "Applied AI Engineer"
  const description =
    settings.site.site_description?.trim() ||
    "Applied AI Engineer building production AI systems, multi-agent workflows, RAG pipelines, document intelligence platforms, and automation systems."

  const site = generateCanonicalUrl(siteUrl, "/")

  return `# ${ownerName}

> ${description}

## About

- Name: ${ownerName}
- Role: ${ownerTitle}
- Focus: Production AI systems, applied research, and automation
- Site: ${site}

## Primary sections

${llmsLink(siteUrl, "/", "Homepage", "Profile, selected work, and knowledge previews")}
${llmsLink(siteUrl, "/about", "About", "Background and biography")}
${llmsLink(siteUrl, "/projects", "Projects", "Production systems and case studies")}
${llmsLink(siteUrl, "/expertise", "Expertise", "Authority pages by domain")}
${llmsLink(siteUrl, "/technology", "Technology", "Technology aggregation pages")}
${llmsLink(siteUrl, "/stack", "Tech stack", "Stack overview")}
${llmsLink(siteUrl, "/research", "Research", "Applied AI research")}
${llmsLink(siteUrl, "/blog", "Writing", "Essays and technical writing")}
${llmsLink(siteUrl, "/automations", "Automations", "Automation workflows and systems")}
${llmsLink(siteUrl, "/experience", "Experience", "Professional experience")}
${llmsLink(siteUrl, "/contact", "Contact", "Collaboration and hiring inquiries")}
${llmsLink(siteUrl, "/privacy", "Privacy policy", "Analytics, monitoring, and AI assistant data practices")}
${llmsLink(siteUrl, "/resume", "Resume", "Current resume PDF")}

## Knowledge graph

This portfolio exposes a machine-readable knowledge graph connecting expertise domains, technologies, projects, research, writing, and automations.

${llmsLink(siteUrl, "/expertise", "Expertise index")}
${llmsLink(siteUrl, "/technology", "Technology index")}
${llmsLink(siteUrl, "/api/knowledge-graph", "Knowledge graph API", "Entities and relationships export")}
${llmsLink(siteUrl, "/api/discovery", "Discovery API", "Search and document index")}

## Content types

### Projects

Production systems with AI summaries, project facts, tradeoffs, FAQ, key takeaways, and expertise badges.

${llmsLink(siteUrl, "/projects", "Browse projects")}

### Research

Applied AI research with TechArticle structured data, FAQ schema, and knowledge graph related content.

${llmsLink(siteUrl, "/research", "Browse research")}

### Writing

Essays and technical writing with machine-readable summaries and FAQ where applicable.

${llmsLink(siteUrl, "/blog", "Browse writing")}

### Automations

Automation systems and workflows linked to expertise domains and technologies.

${llmsLink(siteUrl, "/automations", "Browse automations")}

## Agent kit

${llmsLink(siteUrl, "/agents.json", "Agent action manifest", "Typed actions for search, browse, and graph export")}
${llmsLink(siteUrl, "/agent-instructions.md", "Agent runbook", "Navigation rules and escalation path")}

## Optional

${llmsLink(siteUrl, "/explore", "Explore", "Discovery UI")}
${llmsLink(siteUrl, "/search", "Search", "Public search page")}
${llmsLink(siteUrl, "/ai-first", "AI-first", "AI engineering philosophy")}
${llmsLink(siteUrl, "/concept", "Concepts", "Concept index")}
${llmsLink(siteUrl, "/sitemap.xml", "Sitemap")}
${llmsLink(siteUrl, "/robots.txt", "Robots")}
${llmsLink(siteUrl, "/llms.txt", "LLMs file")}

## Crawling notes

- Sitemap: /sitemap.xml
- Robots: /robots.txt
- Admin routes are excluded from indexing
- Published content only is included in the sitemap
- FAQPage JSON-LD is emitted on project and content pages with FAQ data

## Preferred citation

When referencing this portfolio, link to the canonical URL from the sitemap. For expertise claims, prefer \`/expertise/[slug]\` authority pages. For technology usage, prefer \`/technology/[slug]\` aggregation pages.
`
}

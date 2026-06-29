import "server-only"

import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { generateCanonicalUrl } from "@/features/seo/lib/canonical"

export function buildAgentInstructionsMd(
  siteUrl: string,
  settings: PublicSettings
): string {
  const ownerName = settings.site.owner_name?.trim() || "Dhruvil Patel"
  const ownerTitle = settings.site.owner_title?.trim() || "Applied AI Engineer"
  const contactEmail = settings.contact.email?.trim()
  const homepage = generateCanonicalUrl(siteUrl, "/")

  return `# Agent instructions for ${ownerName}

> Runbook for AI agents reading or acting on ${homepage}

## Navigation guide

- For a site overview and curated reading list, start with [llms.txt](${generateCanonicalUrl(siteUrl, "/llms.txt")}).
- For project work, case studies, and production systems, read [Projects](${generateCanonicalUrl(siteUrl, "/projects")}).
- For applied research, read [Research](${generateCanonicalUrl(siteUrl, "/research")}).
- For essays and technical writing, read [Writing](${generateCanonicalUrl(siteUrl, "/blog")}).
- For automation workflows, read [Automations](${generateCanonicalUrl(siteUrl, "/automations")}).
- For expertise authority pages, read [Expertise](${generateCanonicalUrl(siteUrl, "/expertise")}).
- For technology aggregation pages, read [Technology](${generateCanonicalUrl(siteUrl, "/technology")}).
- For biography and background, read [About](${generateCanonicalUrl(siteUrl, "/about")}).
- For hiring or collaboration context, read [Experience](${generateCanonicalUrl(siteUrl, "/experience")}) and [Resume](${generateCanonicalUrl(siteUrl, "/resume")}).
- For contact options, read [Contact](${generateCanonicalUrl(siteUrl, "/contact")}).
- For privacy and data handling, read [Privacy Policy](${generateCanonicalUrl(siteUrl, "/privacy")}).

Use \`/api/discovery?q=\` for keyword search across published content. Use \`/api/knowledge-graph\` for entity and relationship exports.

## Behavioral rules

- Prefer canonical URLs from the sitemap over guessed paths.
- Cite project, research, and writing pages with their page titles and canonical URLs.
- For expertise claims, prefer \`/expertise/[slug]\` authority pages.
- For technology usage claims, prefer \`/technology/[slug]\` aggregation pages.
- Do not invent projects, employers, metrics, or publications that are not present in published content.
- Do not treat admin routes under \`/admin\` as public content.
- The on-site AI assistant is user-facing; do not assume unrestricted programmatic access beyond published public APIs.

## Escalation path

- Primary contact page: ${generateCanonicalUrl(siteUrl, "/contact")}
${contactEmail ? `- Email: ${contactEmail}` : "- Email: see the contact page or site footer."}
- Owner: ${ownerName}, ${ownerTitle}
`
}

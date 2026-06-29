import Link from "next/link"

import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { buildKnowledgeGraph } from "@/features/knowledge-base/lib/graph"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import { buildBaseMetadata } from "@/features/seo/lib/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildBaseMetadata(
    { settings },
    {
      title: "Technologies",
      description:
        "Technologies used across projects, research, writing, and automations.",
      path: "/technology",
    }
  )
}

export default async function TechnologyIndexPage() {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const graph = siteUrl ? await buildKnowledgeGraph(siteUrl) : null

  return (
    <PageShell
      description="Technology-centric view of the knowledge graph."
      title="Technologies"
    >
      {graph && graph.technologies.length > 0 ? (
        <ul className="technology-index-list">
          {graph.technologies.map((tech) => (
            <li key={tech.slug}>
              <Link
                className="technology-index-link"
                href={`/technology/${tech.slug}`}
              >
                {tech.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="kb-empty-message">
          Technologies will appear as projects publish tech stacks.
        </p>
      )}
    </PageShell>
  )
}

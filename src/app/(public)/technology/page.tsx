import Link from "next/link"

import { PageShell } from "@/components/public/content-shell"
import { buildKnowledgeGraph } from "@/lib/knowledge/graph"
import { getPublicSettings } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"
import { buildBaseMetadata } from "@/lib/seo/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildBaseMetadata(
    { settings },
    {
      title: "Technologies",
      description: "Technologies used across projects, research, writing, and automations.",
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
              <Link className="technology-index-link" href={`/technology/${tech.slug}`}>
                {tech.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="kb-empty-message">Technologies will appear as projects publish tech stacks.</p>
      )}
    </PageShell>
  )
}

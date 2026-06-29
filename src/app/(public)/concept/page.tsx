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
      title: "Concepts",
      description:
        "Engineering concepts across projects, research, writing, and automations.",
      path: "/concept",
    }
  )
}

export default async function ConceptIndexPage() {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const graph = siteUrl ? await buildKnowledgeGraph(siteUrl) : null

  return (
    <PageShell
      description="Concept-centric authority pages for GEO and machine retrieval."
      title="Concepts"
    >
      {graph && graph.concepts.length > 0 ? (
        <ul className="concept-index-list">
          {graph.concepts.map((concept) => (
            <li key={concept.slug}>
              <Link
                className="concept-index-link"
                href={`/concept/${concept.slug}`}
              >
                <span className="concept-index-title">{concept.title}</span>
                {concept.registered ? (
                  <span className="concept-index-badge">Authority page</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="kb-empty-message">
          Concepts will appear as content publishes concept tags.
        </p>
      )}
    </PageShell>
  )
}

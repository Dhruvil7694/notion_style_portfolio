import { ExplorePageClient } from "@/features/discovery/components/explore-page-client"
import {
  buildTopicClusters,
  getExplorerSections,
} from "@/features/discovery/lib/explorer"
import { buildDiscoveryIndexFromGraph } from "@/features/discovery/lib/indexer"
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
      title: "Knowledge Explorer",
      description:
        "Browse projects, research, writing, automations, expertise, technologies, and concepts across the knowledge graph.",
      path: "/explore",
    }
  )
}

export default async function ExplorePage() {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const graph = siteUrl ? await buildKnowledgeGraph(siteUrl) : null

  if (!graph) {
    return (
      <PageShell
        description="Discovery hub for navigating the portfolio knowledge graph."
        title="Knowledge Explorer"
      >
        <p className="kb-empty-message">Knowledge explorer is unavailable.</p>
      </PageShell>
    )
  }

  const documents = buildDiscoveryIndexFromGraph(graph)
  const sections = getExplorerSections(documents)
  const clusters = buildTopicClusters(graph, 4)

  return (
    <PageShell
      description="Discovery hub for navigating projects, research, expertise, technologies, and concepts."
      title="Knowledge Explorer"
    >
      <ExplorePageClient clusters={clusters} sections={sections} />
    </PageShell>
  )
}

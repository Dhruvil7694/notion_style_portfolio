import { PageShell } from "@/components/public/content-shell"
import { ExplorePageClient } from "@/components/public/explore-page-client"
import { buildTopicClusters, getExplorerSections } from "@/lib/discovery/explorer"
import { buildDiscoveryIndexFromGraph } from "@/lib/discovery/indexer"
import { buildKnowledgeGraph } from "@/lib/knowledge/graph"
import { getPublicSettings } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"
import { buildBaseMetadata } from "@/lib/seo/metadata"

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

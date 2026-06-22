"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { createAnalyticsEvent } from "@/lib/analytics/events"
import { searchDocuments } from "@/lib/discovery/search"
import type { DiscoveryDocument, TopicCluster } from "@/lib/discovery/types"
import { DISCOVERY_TYPE_LABELS } from "@/lib/discovery/types"

type ExplorePageClientProps = {
  sections: {
    projects: DiscoveryDocument[]
    research: DiscoveryDocument[]
    articles: DiscoveryDocument[]
    automations: DiscoveryDocument[]
    expertise: DiscoveryDocument[]
    technologies: DiscoveryDocument[]
    concepts: DiscoveryDocument[]
    popularTopics: DiscoveryDocument[]
    recentlyUpdated: DiscoveryDocument[]
    featuredExpertise: DiscoveryDocument[]
  }
  clusters: TopicCluster[]
}

function toRelativePath(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url.startsWith("/") ? url : `/${url}`
  }
}

function ExploreSection({
  title,
  items,
  sectionKey,
}: {
  title: string
  items: DiscoveryDocument[]
  sectionKey: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="discovery-explore-section" id={sectionKey}>
      <h2 className="knowledge-section-title">{title}</h2>
      <ul className="discovery-explore-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              className="discovery-explore-link"
              href={toRelativePath(item.url)}
              onClick={() => {
                void createAnalyticsEvent("explore_navigation", {
                  section: sectionKey,
                  targetType: item.type,
                  targetSlug: item.slug,
                })
              }}
            >
              <span className="discovery-explore-title">{item.title}</span>
              {item.description ? (
                <span className="discovery-explore-description">{item.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TopicClusterSection({ cluster }: { cluster: TopicCluster }) {
  const groups = [
    { title: "Projects", items: cluster.projects },
    { title: "Research", items: cluster.research },
    { title: "Writing", items: cluster.articles },
    { title: "Automations", items: cluster.automations },
    { title: "Concepts", items: cluster.concepts },
    { title: "Technologies", items: cluster.technologies },
    { title: "Expertise", items: cluster.expertise },
  ].filter((group) => group.items.length > 0)

  if (groups.length === 0) {
    return null
  }

  return (
    <section className="discovery-cluster">
      <h2 className="knowledge-section-title">{cluster.title}</h2>
      <div className="discovery-cluster-grid">
        {groups.map((group) => (
          <div className="discovery-cluster-group" key={group.title}>
            <h3 className="discovery-cluster-group-title">{group.title}</h3>
            <ul className="discovery-explore-list">
              {group.items.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link className="discovery-explore-link" href={toRelativePath(item.url)}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ExplorePageClient({ sections, clusters }: ExplorePageClientProps) {
  const [query, setQuery] = useState("")

  const allDocuments = useMemo(
    () => [
      ...sections.projects,
      ...sections.research,
      ...sections.articles,
      ...sections.automations,
      ...sections.expertise,
      ...sections.technologies,
      ...sections.concepts,
    ],
    [sections]
  )

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return null
    }

    return searchDocuments(allDocuments, query, { limit: 40 })
  }, [allDocuments, query])

  return (
    <div className="discovery-explore">
      <div className="discovery-search-input-wrap discovery-search-page-input">
        <label className="sr-only" htmlFor="explore-filter-input">
          Filter knowledge explorer
        </label>
        <input
          className="discovery-search-input"
          id="explore-filter-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter knowledge..."
          type="search"
          value={query}
        />
      </div>

      {filtered ? (
        <section className="discovery-explore-section">
          <h2 className="knowledge-section-title">Search Results</h2>
          {filtered.length === 0 ? (
            <p className="discovery-search-empty">No matches for &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul className="discovery-explore-list">
              {filtered.map((item) => (
                <li key={item.id}>
                  <Link className="discovery-explore-link" href={toRelativePath(item.url)}>
                    <span className="discovery-explore-meta">{DISCOVERY_TYPE_LABELS[item.type]}</span>
                    <span className="discovery-explore-title">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <ExploreSection items={sections.popularTopics} sectionKey="popular-topics" title="Popular Topics" />
          <ExploreSection items={sections.recentlyUpdated} sectionKey="recently-updated" title="Recently Updated" />
          <ExploreSection
            items={sections.featuredExpertise}
            sectionKey="featured-expertise"
            title="Featured Expertise"
          />

          {clusters.map((cluster) => (
            <TopicClusterSection cluster={cluster} key={cluster.id} />
          ))}

          <ExploreSection items={sections.projects} sectionKey="projects" title="Projects" />
          <ExploreSection items={sections.research} sectionKey="research" title="Research" />
          <ExploreSection items={sections.articles} sectionKey="writing" title="Writing" />
          <ExploreSection items={sections.automations} sectionKey="automations" title="Automations" />
          <ExploreSection items={sections.expertise} sectionKey="expertise" title="Expertise" />
          <ExploreSection items={sections.technologies} sectionKey="technologies" title="Technologies" />
          <ExploreSection items={sections.concepts} sectionKey="concepts" title="Concepts" />
        </>
      )}
    </div>
  )
}

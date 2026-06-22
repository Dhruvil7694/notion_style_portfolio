"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { DiscoverySearchResults } from "@/components/public/discovery-ui"
import { searchConfig } from "@/config/search"
import { createAnalyticsEvent } from "@/lib/analytics/events"
import { groupSearchResults, searchDocuments } from "@/lib/discovery/search"
import type { DiscoveryDocument, GroupedDiscoveryResults } from "@/lib/discovery/types"
import { recordContentView, recordSearchQuery } from "@/lib/public/visitor-interest"

type SearchPageClientProps = {
  initialQuery?: string
}

export function SearchPageClient({ initialQuery = "" }: SearchPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [documents, setDocuments] = useState<DiscoveryDocument[]>([])
  const [groups, setGroups] = useState<GroupedDiscoveryResults[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<number | null>(null)

  const flatResults = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  )

  useEffect(() => {
    async function loadIndex() {
      setLoading(true)
      try {
        const response = await fetch("/api/discovery")
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { documents: DiscoveryDocument[] }
        setDocuments(payload.documents ?? [])
      } finally {
        setLoading(false)
      }
    }

    void loadIndex()
  }, [])

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "")
  }, [searchParams])

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      const trimmed = query.trim()
      const params = new URLSearchParams(searchParams.toString())

      if (trimmed) {
        params.set("q", trimmed)
      } else {
        params.delete("q")
      }

      const next = params.toString()
      router.replace(next ? `/search?${next}` : "/search", { scroll: false })

      if (!trimmed) {
        setGroups([])
        setActiveIndex(0)
        return
      }

      const results = searchDocuments(documents, trimmed, { limit: 60 })
      setGroups(groupSearchResults(results))
      setActiveIndex(0)
      recordSearchQuery(trimmed, results.length)
      void createAnalyticsEvent("search_query", {
        query: trimmed,
        resultCount: results.length,
      })
    }, searchConfig.debounceMs)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [documents, query, router, searchParams])

  const navigateToResult = useCallback(
    (item: DiscoveryDocument, index: number) => {
      recordContentView(item)
      void createAnalyticsEvent("search_result_click", {
        query: query.trim(),
        resultType: item.type,
        resultSlug: item.slug,
        resultTitle: item.title,
        position: index + 1,
      })
      router.push(new URL(item.url).pathname)
    },
    [query, router]
  )

  const suggestions = useMemo(() => {
    if (query.trim() || documents.length === 0) {
      return []
    }

    return documents
      .filter((document) => document.type === "concept" || document.type === "expertise")
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 8)
  }, [documents, query])

  return (
    <div className="discovery-search-page">
      <div className="discovery-search-input-wrap discovery-search-page-input">
        <label className="sr-only" htmlFor="discovery-page-input">
          Search knowledge
        </label>
        <input
          autoComplete="off"
          autoFocus
          className="discovery-search-input"
          id="discovery-page-input"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setActiveIndex((current) => Math.min(current + 1, Math.max(flatResults.length - 1, 0)))
            }

            if (event.key === "ArrowUp") {
              event.preventDefault()
              setActiveIndex((current) => Math.max(current - 1, 0))
            }

            if (event.key === "Enter" && flatResults[activeIndex]) {
              event.preventDefault()
              navigateToResult(flatResults[activeIndex], activeIndex)
            }
          }}
          placeholder="Search projects, research, writing, expertise, technologies, concepts..."
          spellCheck={false}
          type="search"
          value={query}
        />
      </div>

      {loading ? <p className="discovery-search-empty">Loading search index...</p> : null}

      {!loading && !query.trim() && suggestions.length > 0 ? (
        <section className="discovery-search-group">
          <h2 className="discovery-search-group-title">Popular Topics</h2>
          <ul className="discovery-search-group-list">
            {suggestions.map((item) => (
              <li key={item.id}>
                <Link className="discovery-search-result discovery-search-link" href={new URL(item.url).pathname}>
                  <span className="discovery-search-result-title">{item.title}</span>
                  {item.description ? (
                    <span className="discovery-search-result-description">{item.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!loading && query.trim() ? (
        <DiscoverySearchResults
          activeIndex={activeIndex}
          groups={groups}
          listId="discovery-page-results"
          onHover={setActiveIndex}
          onSelect={navigateToResult}
        />
      ) : null}
    </div>
  )
}

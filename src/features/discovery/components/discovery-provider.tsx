"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { DiscoverySearchResults } from "@/features/discovery/components/discovery-ui"
import {
  groupSearchResults,
  searchDocuments,
} from "@/features/discovery/lib/search"
import type {
  DiscoveryDocument,
  GroupedDiscoveryResults,
} from "@/features/discovery/lib/types"
import {
  readVisitorProfile,
  recordContentView,
  recordSearchQuery,
  subscribeVisitorInterest,
} from "@/features/personalization/lib/visitor-interest"
import {
  formatUserFacingError,
  type UserFacingErrorDisplay,
} from "@/features/portfolio/lib/user-facing-error"
import { ErrorAlert } from "@/shared/components/error-alert"
import { searchConfig } from "@/shared/config/search"
import { createAnalyticsEvent } from "@/shared/lib/analytics/events"

export { writeRecentlyViewed } from "@/features/personalization/lib/visitor-interest"

type DiscoveryContextValue = {
  open: boolean
  openPalette: (source?: "keyboard" | "header" | "search_page" | "dock") => void
  closePalette: () => void
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null)

export function useDiscovery() {
  const context = useContext(DiscoveryContext)
  if (!context) {
    throw new Error("useDiscovery must be used within DiscoveryProvider")
  }

  return context
}

type DiscoveryProviderProps = {
  children: ReactNode
}

export function DiscoveryProvider({ children }: DiscoveryProviderProps) {
  const [open, setOpen] = useState(false)

  const openPalette = useCallback(
    (source: "keyboard" | "header" | "search_page" | "dock" = "keyboard") => {
      setOpen(true)
      void createAnalyticsEvent("search_opened", { source })
    },
    []
  )

  const closePalette = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      open,
      openPalette,
      closePalette,
    }),
    [closePalette, open, openPalette]
  )

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
    </DiscoveryContext.Provider>
  )
}

type CommandPaletteProps = {
  enabled?: boolean
}

export function CommandPalette({ enabled = true }: CommandPaletteProps) {
  const router = useRouter()
  const { open, closePalette } = useDiscovery()
  const [query, setQuery] = useState("")
  const [documents, setDocuments] = useState<DiscoveryDocument[]>([])
  const [groups, setGroups] = useState<GroupedDiscoveryResults[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<UserFacingErrorDisplay | null>(
    null
  )
  const [recentlyViewed, setRecentlyViewed] = useState<DiscoveryDocument[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | null>(null)

  const flatResults = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  )

  const suggestions = useMemo(() => {
    if (query.trim() || documents.length === 0) {
      return {
        popularTopics: [] as DiscoveryDocument[],
        featuredProjects: [] as DiscoveryDocument[],
        featuredConcepts: [] as DiscoveryDocument[],
      }
    }

    return {
      popularTopics: documents
        .filter(
          (document) =>
            document.type === "concept" || document.type === "expertise"
        )
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5),
      featuredProjects: documents
        .filter((document) => document.type === "project")
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 4),
      featuredConcepts: documents
        .filter((document) => document.type === "concept")
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 4),
    }
  }, [documents, query])

  const loadIndex = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/api/discovery")
      if (!response.ok) {
        setLoadError(
          formatUserFacingError(
            "Search index couldn't load. Please refresh and try again."
          )
        )
        setDocuments([])
        return
      }

      const payload = (await response.json()) as {
        documents: DiscoveryDocument[]
      }
      setDocuments(payload.documents ?? [])
    } catch {
      setLoadError(
        formatUserFacingError(
          "Search index couldn't load. Check your connection and retry."
        )
      )
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !open) {
      return
    }

    setRecentlyViewed(readVisitorProfile().recentlyViewed)
    void loadIndex()
    setQuery("")
    setActiveIndex(0)

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    const unsubscribe = subscribeVisitorInterest(() => {
      setRecentlyViewed(readVisitorProfile().recentlyViewed)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      unsubscribe()
    }
  }, [enabled, loadIndex, open])

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        closePalette()
        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        setActiveIndex((current) =>
          Math.min(current + 1, Math.max(flatResults.length - 1, 0))
        )
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        setActiveIndex((current) => Math.max(current - 1, 0))
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [closePalette, flatResults.length, open])

  useEffect(() => {
    if (!open) {
      return
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      const trimmed = query.trim()
      if (!trimmed) {
        setGroups([])
        setActiveIndex(0)
        return
      }

      const results = searchDocuments(documents, trimmed, { limit: 40 })
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
  }, [documents, open, query])

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

      closePalette()
      router.push(new URL(item.url).pathname)
    },
    [closePalette, query, router]
  )

  if (!enabled || !open) {
    return null
  }

  const showSuggestions = !query.trim()

  return (
    <div className="discovery-palette-root" role="presentation">
      <button
        aria-label="Close search"
        className="discovery-palette-backdrop"
        onClick={closePalette}
        type="button"
      />
      <div
        aria-label="Search knowledge"
        aria-modal="true"
        className="discovery-palette"
        role="dialog"
      >
        <div className="discovery-search-input-wrap">
          <label className="sr-only" htmlFor="discovery-palette-input">
            Search projects, research, expertise, technologies, and concepts
          </label>
          <input
            autoComplete="off"
            className="discovery-search-input"
            id="discovery-palette-input"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && flatResults[activeIndex]) {
                event.preventDefault()
                navigateToResult(flatResults[activeIndex], activeIndex)
              }
            }}
            placeholder="Search knowledge..."
            ref={inputRef}
            spellCheck={false}
            type="text"
            value={query}
          />
          <span className="discovery-search-hint">Esc to close</span>
        </div>

        <div className="discovery-search-body" data-lenis-prevent>
          {loading ? (
            <p className="discovery-search-empty">Loading index...</p>
          ) : null}

          {!loading && loadError ? (
            <div className="p-4">
              <ErrorAlert
                error={loadError}
                onRetry={() => void loadIndex()}
                size="md"
              />
            </div>
          ) : null}

          {!loading && !loadError && showSuggestions ? (
            <div className="discovery-search-results">
              {recentlyViewed.length > 0 ? (
                <section className="discovery-search-group">
                  <h3 className="discovery-search-group-title">
                    Recently Viewed
                  </h3>
                  <ul className="discovery-search-group-list">
                    {recentlyViewed.map((item) => (
                      <li key={item.id}>
                        <button
                          className="discovery-search-result"
                          onClick={() => navigateToResult(item, 0)}
                          type="button"
                        >
                          <span className="discovery-search-result-title">
                            {item.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {suggestions.featuredProjects.length > 0 ? (
                <section className="discovery-search-group">
                  <h3 className="discovery-search-group-title">
                    Featured Projects
                  </h3>
                  <ul className="discovery-search-group-list">
                    {suggestions.featuredProjects.map((item) => (
                      <li key={item.id}>
                        <button
                          className="discovery-search-result"
                          onClick={() => navigateToResult(item, 0)}
                          type="button"
                        >
                          <span className="discovery-search-result-title">
                            {item.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {suggestions.popularTopics.length > 0 ? (
                <section className="discovery-search-group">
                  <h3 className="discovery-search-group-title">
                    Popular Topics
                  </h3>
                  <ul className="discovery-search-group-list">
                    {suggestions.popularTopics.map((item) => (
                      <li key={item.id}>
                        <button
                          className="discovery-search-result"
                          onClick={() => navigateToResult(item, 0)}
                          type="button"
                        >
                          <span className="discovery-search-result-title">
                            {item.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {suggestions.featuredConcepts.length > 0 ? (
                <section className="discovery-search-group">
                  <h3 className="discovery-search-group-title">
                    Featured Concepts
                  </h3>
                  <ul className="discovery-search-group-list">
                    {suggestions.featuredConcepts.map((item) => (
                      <li key={item.id}>
                        <button
                          className="discovery-search-result"
                          onClick={() => navigateToResult(item, 0)}
                          type="button"
                        >
                          <span className="discovery-search-result-title">
                            {item.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          {!loading && !loadError && !showSuggestions ? (
            <DiscoverySearchResults
              activeIndex={activeIndex}
              groups={groups}
              listId="discovery-palette-results"
              onHover={setActiveIndex}
              onSelect={navigateToResult}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

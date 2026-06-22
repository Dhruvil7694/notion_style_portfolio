"use client"

import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useDockSearchRegistration } from "@/components/public/dock-search-context"
import { DiscoverySuggestionList } from "@/components/public/discovery-ui"
import { featureFlags } from "@/config/feature-flags"
import { searchConfig } from "@/config/search"
import { createAnalyticsEvent } from "@/lib/analytics/events"
import { groupSearchResults, searchDocuments } from "@/lib/discovery/search"
import { formatShortcutLabel } from "@/lib/discovery/shortcuts"
import type { DiscoveryDocument, GroupedDiscoveryResults } from "@/lib/discovery/types"
import { glassPanelClass } from "@/lib/public/glass-panel"
import {
  readVisitorProfile,
  recordContentView,
  recordSearchQuery,
  subscribeVisitorInterest,
} from "@/lib/public/visitor-interest"
import { cn } from "@/lib/utils"
import { trapNestedScrollWheel } from "@/lib/utils/trap-nested-scroll-wheel"

import { DockSearchResults } from "./dock-search-results"

function toRelativePath(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url.startsWith("/") ? url : `/${url}`
  }
}

export function DockSearch() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [query, setQuery] = useState("")
  const [documents, setDocuments] = useState<DiscoveryDocument[]>([])
  const [groups, setGroups] = useState<GroupedDiscoveryResults[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [indexLoading, setIndexLoading] = useState(false)
  const [indexLoaded, setIndexLoaded] = useState(false)
  const [indexError, setIndexError] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState<DiscoveryDocument[]>([])
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K")
  const fetchStartedRef = useRef(false)
  const debounceRef = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const expanded = hovered || focused || pinned
  const trimmedQuery = query.trim()
  const showResults = expanded && (trimmedQuery.length > 0 || recentlyViewed.length > 0)

  const flatResults = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  )

  const openSearch = useCallback(() => {
    setPinned(true)
    void createAnalyticsEvent("search_opened", { source: "keyboard" })
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  const closeSearch = useCallback(() => {
    setPinned(false)
    setFocused(false)
    setQuery("")
    setGroups([])
    setActiveIndex(0)
    inputRef.current?.blur()
  }, [])

  useDockSearchRegistration(
    useMemo(
      () => ({
        open: openSearch,
        close: closeSearch,
      }),
      [closeSearch, openSearch]
    )
  )

  const loadIndex = useCallback(async () => {
    if (indexLoaded || fetchStartedRef.current) {
      return
    }

    fetchStartedRef.current = true
    setIndexLoading(true)
    setIndexError(false)

    try {
      const response = await fetch("/api/discovery")
      if (!response.ok) {
        setIndexError(true)
        return
      }

      const payload = (await response.json()) as { documents: DiscoveryDocument[] }
      setDocuments(payload.documents ?? [])
      setIndexLoaded(true)
    } catch {
      setIndexError(true)
    } finally {
      fetchStartedRef.current = false
      setIndexLoading(false)
    }
  }, [indexLoaded])

  useEffect(() => {
    setShortcutLabel(
      formatShortcutLabel(
        typeof navigator !== "undefined" &&
          /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      )
    )
  }, [])

  useEffect(() => {
    if (!expanded) {
      return
    }

    setRecentlyViewed(readVisitorProfile().recentlyViewed)
    void loadIndex()

    return subscribeVisitorInterest(() => {
      setRecentlyViewed(readVisitorProfile().recentlyViewed)
    })
  }, [expanded, loadIndex])

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      if (!trimmedQuery) {
        setGroups([])
        setActiveIndex(0)
        return
      }

      const results = searchDocuments(documents, trimmedQuery, { limit: 14 })
      setGroups(groupSearchResults(results))
      setActiveIndex(0)
      recordSearchQuery(trimmedQuery, results.length)
      void createAnalyticsEvent("search_query", {
        query: trimmedQuery,
        resultCount: results.length,
      })
    }, searchConfig.debounceMs)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [documents, trimmedQuery])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        if (pinned) {
          closeSearch()
        } else {
          setFocused(false)
        }
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [closeSearch, pinned])

  const navigateToResult = useCallback(
    (item: DiscoveryDocument, index: number) => {
      recordContentView(item)
      void createAnalyticsEvent("search_result_click", {
        query: trimmedQuery,
        resultType: item.type,
        resultSlug: item.slug,
        resultTitle: item.title,
        position: index + 1,
      })

      closeSearch()
      router.push(toRelativePath(item.url))
    },
    [closeSearch, router, trimmedQuery]
  )

  if (!featureFlags.enableSearch) {
    return null
  }

  return (
    <div
      className={cn("dock-search-root", expanded && "dock-search-root-expanded")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={rootRef}
    >
      <div
        className={cn("dock-search", glassPanelClass, expanded && "dock-search-expanded")}
        onBlurCapture={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
            setFocused(false)
          }
        }}
        onFocusCapture={() => setFocused(true)}
      >
        <Search aria-hidden className="dock-search-icon" strokeWidth={1.75} />

        <label className="sr-only" htmlFor="dock-search-input">
          Search projects, research, expertise, and more
        </label>
        <input
          autoComplete="off"
          className="dock-search-input"
          id="dock-search-input"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (!pinned) {
              void createAnalyticsEvent("search_opened", { source: "dock" })
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              closeSearch()
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
              return
            }

            if (event.key === "Enter" && flatResults[activeIndex]) {
              event.preventDefault()
              navigateToResult(flatResults[activeIndex], activeIndex)
            }
          }}
          placeholder="Search..."
          ref={inputRef}
          spellCheck={false}
          tabIndex={expanded ? 0 : -1}
          type="search"
          value={query}
        />

        {expanded && !query ? (
          <kbd aria-hidden className="dock-search-kbd">
            {shortcutLabel}
          </kbd>
        ) : null}

        {query ? (
          <button
            aria-label="Clear search"
            className="dock-search-clear"
            onClick={() => {
              setQuery("")
              setGroups([])
              setActiveIndex(0)
              inputRef.current?.focus()
            }}
            type="button"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {!expanded ? (
          <button
            aria-label="Open search"
            className="dock-search-trigger"
            onClick={openSearch}
            type="button"
          />
        ) : null}
      </div>

      {showResults ? (
        <div className={cn("dock-search-panel", glassPanelClass)}>
          <div
            className="dock-search-panel-scroll"
            data-lenis-prevent
            onWheel={trapNestedScrollWheel}
            ref={scrollRef}
          >
            {indexLoading ? (
              <p className="dock-search-panel-empty">Loading index...</p>
            ) : indexError ? (
              <p className="dock-search-panel-empty">Search is temporarily unavailable.</p>
            ) : trimmedQuery ? (
              flatResults.length === 0 ? (
                <p className="dock-search-panel-empty">
                  No results for &ldquo;{trimmedQuery}&rdquo;
                </p>
              ) : (
                <DockSearchResults
                  activeIndex={activeIndex}
                  groups={groups}
                  onHover={setActiveIndex}
                  onSelect={navigateToResult}
                />
              )
            ) : recentlyViewed.length > 0 ? (
              <DiscoverySuggestionList
                items={recentlyViewed}
                onSelect={(item) => navigateToResult(item, 0)}
                title="Recent"
              />
            ) : (
              <p className="dock-search-panel-empty">Start typing to search the knowledge base.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

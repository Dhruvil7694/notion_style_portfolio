"use client"

import Link from "next/link"

import type {
  DiscoveryDocument,
  GroupedDiscoveryResults,
} from "@/features/discovery/lib/types"
import { cn } from "@/shared/lib/utils"

function toRelativePath(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url.startsWith("/") ? url : `/${url}`
  }
}

type DiscoveryEntitySectionProps = {
  title: string
  items: DiscoveryDocument[]
  className?: string
}

export function DiscoveryEntitySection({
  title,
  items,
  className,
}: DiscoveryEntitySectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className={cn("knowledge-related", className)}>
      <h2 className="knowledge-section-title">{title}</h2>
      <ul className="knowledge-related-list">
        {items.map((item) => (
          <li className="knowledge-related-item" key={item.id}>
            <Link
              className="knowledge-related-link"
              href={toRelativePath(item.url)}
            >
              <span className="knowledge-related-title">{item.title}</span>
              {item.description ? (
                <span className="knowledge-related-description">
                  {item.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

type EntityNavigationSectionsProps = {
  relatedExpertise?: DiscoveryDocument[]
  relatedTechnologies?: DiscoveryDocument[]
  relatedConcepts?: DiscoveryDocument[]
  relatedContent?: DiscoveryDocument[]
}

export function EntityNavigationSections({
  relatedExpertise = [],
  relatedTechnologies = [],
  relatedConcepts = [],
  relatedContent = [],
}: EntityNavigationSectionsProps) {
  return (
    <>
      <DiscoveryEntitySection
        items={relatedExpertise}
        title="Related Expertise"
      />
      <DiscoveryEntitySection
        items={relatedTechnologies}
        title="Related Technologies"
      />
      <DiscoveryEntitySection
        items={relatedConcepts}
        title="Related Concepts"
      />
      <DiscoveryEntitySection items={relatedContent} title="Related Content" />
    </>
  )
}

type DiscoverySearchResultsProps = {
  groups: GroupedDiscoveryResults[]
  activeIndex: number
  onSelect: (item: DiscoveryDocument, index: number) => void
  onHover: (index: number) => void
  emptyMessage?: string
  listId?: string
}

function flatIndexForGroup(
  groups: GroupedDiscoveryResults[],
  groupIndex: number,
  itemIndex: number
) {
  let index = 0

  for (let groupIdx = 0; groupIdx < groupIndex; groupIdx += 1) {
    index += groups[groupIdx]?.items.length ?? 0
  }

  return index + itemIndex
}

export function DiscoverySearchResults({
  groups,
  activeIndex,
  onSelect,
  onHover,
  emptyMessage = "No results found.",
  listId = "discovery-search-results",
}: DiscoverySearchResultsProps) {
  const totalResults = groups.reduce(
    (count, group) => count + group.items.length,
    0
  )

  if (totalResults === 0) {
    return <p className="discovery-search-empty">{emptyMessage}</p>
  }

  return (
    <div className="discovery-search-results" id={listId} role="listbox">
      {groups.map((group, groupIndex) => (
        <section className="discovery-search-group" key={group.type}>
          <h3 className="discovery-search-group-title">{group.label}</h3>
          <ul className="discovery-search-group-list">
            {group.items.map((item, itemIndex) => {
              const flatIndex = flatIndexForGroup(groups, groupIndex, itemIndex)
              const active = flatIndex === activeIndex

              return (
                <li key={item.id} role="presentation">
                  <button
                    aria-selected={active}
                    className={cn(
                      "discovery-search-result",
                      active && "discovery-search-result-active"
                    )}
                    id={`${listId}-item-${flatIndex}`}
                    onClick={() => onSelect(item, flatIndex)}
                    onMouseEnter={() => onHover(flatIndex)}
                    role="option"
                    type="button"
                  >
                    <span className="discovery-search-result-title">
                      {item.title}
                    </span>
                    {item.description ? (
                      <span className="discovery-search-result-description">
                        {item.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

type DiscoverySuggestionListProps = {
  title: string
  items: DiscoveryDocument[]
  onSelect: (item: DiscoveryDocument) => void
}

export function DiscoverySuggestionList({
  title,
  items,
  onSelect,
}: DiscoverySuggestionListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="discovery-search-group">
      <h3 className="discovery-search-group-title">{title}</h3>
      <ul className="discovery-search-group-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className="discovery-search-result"
              onClick={() => onSelect(item)}
              type="button"
            >
              <span className="discovery-search-result-title">
                {item.title}
              </span>
              {item.description ? (
                <span className="discovery-search-result-description">
                  {item.description}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

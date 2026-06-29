"use client"

import type {
  DiscoveryDocument,
  GroupedDiscoveryResults,
} from "@/features/discovery/lib/types"
import { DISCOVERY_TYPE_LABELS } from "@/features/discovery/lib/types"
import { cn } from "@/shared/lib/utils"

type DockSearchResultsProps = {
  groups: GroupedDiscoveryResults[]
  activeIndex: number
  onSelect: (item: DiscoveryDocument, index: number) => void
  onHover: (index: number) => void
}

const TYPE_BADGE_LABELS: Record<string, string> = {
  project: "Project",
  research: "Research",
  article: "Writing",
  automation: "Automation",
  expertise: "Expertise",
  technology: "Tech",
  concept: "Concept",
}

function flatIndexForGroup(
  groups: GroupedDiscoveryResults[],
  groupIndex: number,
  itemIndex: number
): number {
  let index = 0

  for (let groupIdx = 0; groupIdx < groupIndex; groupIdx += 1) {
    index += groups[groupIdx]?.items.length ?? 0
  }

  return index + itemIndex
}

function truncateDescription(description: string, maxLength = 56): string {
  const trimmed = description.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`
}

export function DockSearchResults({
  groups,
  activeIndex,
  onSelect,
  onHover,
}: DockSearchResultsProps) {
  return (
    <div className="dock-search-results" role="listbox">
      {groups.map((group, groupIndex) => (
        <section className="dock-search-results-group" key={group.type}>
          <h3 className="dock-search-results-group-title">
            {DISCOVERY_TYPE_LABELS[group.type] ?? group.label}
          </h3>
          <ul className="dock-search-results-list">
            {group.items.map((item, itemIndex) => {
              const flatIndex = flatIndexForGroup(groups, groupIndex, itemIndex)
              const active = flatIndex === activeIndex

              return (
                <li key={item.id} role="presentation">
                  <button
                    aria-selected={active}
                    className={cn(
                      "dock-search-result",
                      active && "dock-search-result-active"
                    )}
                    onClick={() => onSelect(item, flatIndex)}
                    onMouseEnter={() => onHover(flatIndex)}
                    role="option"
                    type="button"
                  >
                    <span className="dock-search-result-copy">
                      <span className="dock-search-result-title">
                        {item.title}
                      </span>
                      {item.description ? (
                        <span className="dock-search-result-description">
                          {truncateDescription(item.description)}
                        </span>
                      ) : null}
                    </span>
                    <span className="dock-search-result-badge">
                      {TYPE_BADGE_LABELS[item.type] ?? item.type}
                    </span>
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

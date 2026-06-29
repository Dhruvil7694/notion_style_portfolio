"use client"

import {
  Check,
  ChevronRight,
  Code2,
  FolderOpen,
  ListFilter,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import {
  countActiveProjectFilters,
  EMPTY_PROJECT_FILTERS,
  hasActiveProjectFilters,
  type ProjectFilterOptions,
  type ProjectFilterState,
} from "@/features/portfolio/lib/project-filters"
import { ProjectsFilterSubmenu } from "@/features/projects/components/projects-filter-submenu"
import { cn } from "@/shared/lib/utils"

type ProjectsListFiltersProps = {
  filters: ProjectFilterState
  options: ProjectFilterOptions
  resultCount: number
  totalCount: number
  onChange: (filters: ProjectFilterState) => void
}

type FilterMenuKey = "category" | "status" | "tech"

export function ProjectsListFilters({
  filters,
  options,
  resultCount,
  totalCount,
  onChange,
}: ProjectsListFiltersProps) {
  const searchId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const submenuHideTimerRef = useRef<number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hoveredMenu, setHoveredMenu] = useState<FilterMenuKey | null>(null)
  const activeCount = countActiveProjectFilters(filters)

  const menuItems: FilterMenuKey[] = [
    ...(options.categories.length > 0 ? (["category"] as const) : []),
    ...(options.techStack.length > 0 ? (["tech"] as const) : []),
    "status",
  ]

  function clearSubmenuHideTimer() {
    if (submenuHideTimerRef.current) {
      window.clearTimeout(submenuHideTimerRef.current)
      submenuHideTimerRef.current = null
    }
  }

  function scheduleSubmenuHide() {
    clearSubmenuHideTimer()
    submenuHideTimerRef.current = window.setTimeout(() => {
      setHoveredMenu(null)
      submenuHideTimerRef.current = null
    }, 120)
  }

  function updateFilters(patch: Partial<ProjectFilterState>) {
    onChange({ ...filters, ...patch })
  }

  function toggleTech(tech: string) {
    const next = filters.tech.includes(tech)
      ? filters.tech.filter((item) => item !== tech)
      : [...filters.tech, tech]

    updateFilters({ tech: next })
  }

  function clearFilters() {
    onChange(EMPTY_PROJECT_FILTERS)
    setFiltersOpen(false)
    setHoveredMenu(null)
  }

  function clearMenuFilters(menu: FilterMenuKey) {
    if (menu === "category") {
      updateFilters({ category: null })
      return
    }

    if (menu === "tech") {
      updateFilters({ tech: [] })
      return
    }

    updateFilters({ featuredOnly: false })
  }

  useEffect(() => {
    if (!filtersOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false)
        setHoveredMenu(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFiltersOpen(false)
        setHoveredMenu(null)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
      clearSubmenuHideTimer()
    }
  }, [filtersOpen])

  return (
    <div className="projects-filters">
      <div className="projects-filters-search-row">
        <label className="projects-filters-search" htmlFor={searchId}>
          <Search
            aria-hidden
            className="projects-filters-search-icon"
            size={16}
            strokeWidth={1.75}
          />
          <input
            className="projects-filters-search-input"
            id={searchId}
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder="Search projects…"
            type="search"
            value={filters.query}
          />
          {filters.query ? (
            <button
              aria-label="Clear search"
              className="projects-filters-search-clear"
              onClick={() => updateFilters({ query: "" })}
              type="button"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          ) : null}
        </label>

        <div className="projects-filters-menu-shell" ref={menuRef}>
          <button
            aria-expanded={filtersOpen}
            aria-haspopup="menu"
            aria-label={
              activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"
            }
            className={cn(
              "projects-filters-menu-trigger",
              (filtersOpen || activeCount > 0) &&
                "projects-filters-menu-trigger-active"
            )}
            onClick={() => {
              setFiltersOpen((value) => !value)
              setHoveredMenu(null)
            }}
            type="button"
          >
            <ListFilter aria-hidden size={16} strokeWidth={1.75} />
            {activeCount > 0 ? (
              <span className="projects-filters-menu-trigger-badge">
                {activeCount}
              </span>
            ) : null}
          </button>

          {filtersOpen ? (
            <div
              className="projects-filters-menu-stack"
              onMouseEnter={clearSubmenuHideTimer}
              onMouseLeave={scheduleSubmenuHide}
            >
              <div className="projects-filters-menu-anchor">
                <div
                  className="projects-filters-menu"
                  onMouseEnter={clearSubmenuHideTimer}
                  role="menu"
                >
                  {menuItems.map((menuKey) => {
                    const active =
                      menuKey === "category"
                        ? filters.category !== null
                        : menuKey === "tech"
                          ? filters.tech.length > 0
                          : filters.featuredOnly

                    return (
                      <button
                        className={cn(
                          "projects-filters-menu-item",
                          hoveredMenu === menuKey &&
                            "projects-filters-menu-item-active"
                        )}
                        key={menuKey}
                        onMouseEnter={() => {
                          clearSubmenuHideTimer()
                          setHoveredMenu(menuKey)
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {menuKey === "category" ? (
                          <FolderOpen
                            aria-hidden
                            size={15}
                            strokeWidth={1.75}
                          />
                        ) : null}
                        {menuKey === "tech" ? (
                          <Code2 aria-hidden size={15} strokeWidth={1.75} />
                        ) : null}
                        {menuKey === "status" ? (
                          <Sparkles aria-hidden size={15} strokeWidth={1.75} />
                        ) : null}
                        <span className="projects-filters-menu-item-label">
                          {menuKey === "category"
                            ? "Category"
                            : menuKey === "tech"
                              ? "Tech stack"
                              : "Status"}
                        </span>
                        {active ? (
                          <span className="projects-filters-menu-item-dot" />
                        ) : null}
                        <ChevronRight
                          aria-hidden
                          className="projects-filters-menu-item-chevron"
                          size={14}
                          strokeWidth={1.75}
                        />
                      </button>
                    )
                  })}
                </div>

                {hoveredMenu ? (
                  <ProjectsFilterSubmenu
                    menuKey={hoveredMenu}
                    onMouseEnter={clearSubmenuHideTimer}
                  >
                    {hoveredMenu === "category" ? (
                      <>
                        <button
                          className={cn(
                            "projects-filters-submenu-option",
                            filters.category === null &&
                              "projects-filters-submenu-option-active"
                          )}
                          onClick={() => updateFilters({ category: null })}
                          role="menuitem"
                          type="button"
                        >
                          <span>All</span>
                          {filters.category === null ? (
                            <Check aria-hidden size={14} strokeWidth={2} />
                          ) : null}
                        </button>
                        {options.categories.map((category) => (
                          <button
                            className={cn(
                              "projects-filters-submenu-option",
                              filters.category === category &&
                                "projects-filters-submenu-option-active"
                            )}
                            key={category}
                            onClick={() =>
                              updateFilters({
                                category:
                                  filters.category === category
                                    ? null
                                    : category,
                              })
                            }
                            role="menuitem"
                            type="button"
                          >
                            <span>{category}</span>
                            {filters.category === category ? (
                              <Check aria-hidden size={14} strokeWidth={2} />
                            ) : null}
                          </button>
                        ))}
                      </>
                    ) : null}

                    {hoveredMenu === "tech" ? (
                      <>
                        {options.techStack.map((tech) => (
                          <button
                            className={cn(
                              "projects-filters-submenu-option",
                              filters.tech.includes(tech) &&
                                "projects-filters-submenu-option-active"
                            )}
                            key={tech}
                            onClick={() => toggleTech(tech)}
                            role="menuitem"
                            type="button"
                          >
                            <span>{tech}</span>
                            {filters.tech.includes(tech) ? (
                              <Check aria-hidden size={14} strokeWidth={2} />
                            ) : null}
                          </button>
                        ))}
                      </>
                    ) : null}

                    {hoveredMenu === "status" ? (
                      <button
                        className={cn(
                          "projects-filters-submenu-option",
                          filters.featuredOnly &&
                            "projects-filters-submenu-option-active"
                        )}
                        onClick={() =>
                          updateFilters({ featuredOnly: !filters.featuredOnly })
                        }
                        role="menuitem"
                        type="button"
                      >
                        <span>Production only</span>
                        {filters.featuredOnly ? (
                          <Check aria-hidden size={14} strokeWidth={2} />
                        ) : null}
                      </button>
                    ) : null}

                    <div
                      className="projects-filters-submenu-separator"
                      role="separator"
                    />

                    <button
                      className="projects-filters-submenu-clear"
                      onClick={() => clearMenuFilters(hoveredMenu)}
                      role="menuitem"
                      type="button"
                    >
                      Clear all
                    </button>
                  </ProjectsFilterSubmenu>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="projects-filters-meta">
        <p className="projects-filters-count">
          {resultCount === totalCount
            ? `${totalCount} project${totalCount === 1 ? "" : "s"}`
            : `${resultCount} of ${totalCount} projects`}
        </p>
        {hasActiveProjectFilters(filters) ? (
          <button
            className="projects-filters-clear"
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  )
}

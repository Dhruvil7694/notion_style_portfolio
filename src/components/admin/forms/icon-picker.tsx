"use client"

import { useEffect, useId, useState } from "react"

import { FormField, TextInput } from "@/components/admin/forms"
import {
  formatIconLabel,
  ProjectIcon,
  resolveProjectIconName,
} from "@/lib/icons/iconify"
import {
  DEFAULT_ICON_SUGGESTIONS,
  ICON_PICKER_VISIBLE_ROWS,
  searchIconifyIcons,
} from "@/lib/icons/search"
import { cn } from "@/lib/utils"

type IconPickerProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  name?: string
}

function IconPickerOption({
  iconName,
  isSelected,
  onSelect,
  onHover,
}: {
  iconName: string
  isSelected: boolean
  onSelect: () => void
  onHover: (iconName: string | null) => void
}) {
  const label = formatIconLabel(iconName)

  return (
    <button
      aria-label={label}
      aria-selected={isSelected}
      className={cn(
        "border-border hover:bg-muted/60 focus-visible:ring-ring flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none",
        isSelected && "border-primary bg-primary/10"
      )}
      onBlur={() => onHover(null)}
      onClick={onSelect}
      onFocus={() => onHover(iconName)}
      onMouseEnter={() => onHover(iconName)}
      onMouseLeave={() => onHover(null)}
      role="option"
      type="button"
    >
      <ProjectIcon className="h-4 w-4" iconName={iconName} />
    </button>
  )
}

export function IconPicker({ value, onChange, error, name = "icon_name" }: IconPickerProps) {
  const listboxId = useId()
  const [query, setQuery] = useState("")
  const [icons, setIcons] = useState<string[]>([...DEFAULT_ICON_SUGGESTIONS])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)

      try {
        const results = await searchIconifyIcons(query)
        if (!cancelled) {
          setIcons(results)
        }
      } catch {
        if (!cancelled) {
          setSearchError("Could not search icons. Try again.")
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [query])

  const selectedIcon = resolveProjectIconName(value || null)
  const gridMaxHeight = `calc(${ICON_PICKER_VISIBLE_ROWS} * 2.25rem + ${ICON_PICKER_VISIBLE_ROWS - 1} * 0.25rem)`

  return (
    <FormField
      error={error}
      hint="Stored as prefix:name (e.g. lucide:brain)."
      label="Icon"
      name={name}
    >
      <div className="space-y-3">
        <div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
          <div className="bg-background border-border flex h-12 w-12 items-center justify-center rounded-md border">
            <ProjectIcon className="h-6 w-6" iconName={selectedIcon} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{formatIconLabel(selectedIcon)}</p>
            <p className="text-muted-foreground truncate text-xs">{selectedIcon}</p>
          </div>
        </div>

        <TextInput
          aria-controls={listboxId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search icons..."
          type="search"
          value={query}
        />

        {searchError ? <p className="text-destructive text-xs">{searchError}</p> : null}

        <div
          aria-label="Icon results"
          className="border-border space-y-2 rounded-lg border p-2"
          id={listboxId}
          role="listbox"
        >
          <p
            aria-live="polite"
            className="text-muted-foreground min-h-4 px-0.5 text-xs"
          >
            {hoveredIcon ? formatIconLabel(hoveredIcon) : "\u00a0"}
          </p>

          {isSearching ? (
            <p className="text-muted-foreground px-2 py-3 text-sm">Searching icons…</p>
          ) : icons.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-sm">No icons found.</p>
          ) : (
            <div
              className="overflow-y-auto pr-1"
              style={{ maxHeight: gridMaxHeight }}
            >
              <div className="flex flex-wrap gap-1">
                {icons.map((iconName) => (
                  <IconPickerOption
                    iconName={iconName}
                    isSelected={value === iconName}
                    key={iconName}
                    onHover={setHoveredIcon}
                    onSelect={() => onChange(iconName)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          Can&apos;t find your icon? Use search above.
        </p>
      </div>
    </FormField>
  )
}

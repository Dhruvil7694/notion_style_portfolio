"use client"

import { useEffect, useId, useMemo, useState } from "react"

import { TextInput } from "@/components/admin/forms"
import {
  filterLucideIcons,
  LUCIDE_ICON_PICKER_DEFAULTS,
  readRecentLucideIcons,
  rememberLucideIcon,
  resolveLucideIcon,
} from "@/lib/diagrams/lucide-icons"
import { cn } from "@/lib/utils"

type LucideIconPickerProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

function IconOption({
  iconName,
  isSelected,
  onSelect,
}: {
  iconName: string
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = resolveLucideIcon(iconName)

  return (
    <button
      aria-label={iconName}
      aria-selected={isSelected}
      className={cn(
        "border-border hover:bg-muted/60 focus-visible:ring-ring flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none",
        isSelected && "border-primary bg-primary/10"
      )}
      onClick={onSelect}
      role="option"
      type="button"
    >
      <Icon className="size-4" />
    </button>
  )
}

export function LucideIconPicker({ value, onChange, className }: LucideIconPickerProps) {
  const listboxId = useId()
  const [query, setQuery] = useState("")
  const [recentIcons, setRecentIcons] = useState<string[]>([])

  useEffect(() => {
    setRecentIcons(readRecentLucideIcons())
  }, [])

  const filteredIcons = useMemo(() => filterLucideIcons(query), [query])
  const displayIcons = query.trim() ? filteredIcons : [...LUCIDE_ICON_PICKER_DEFAULTS]
  const SelectedIcon = resolveLucideIcon(value)

  function selectIcon(iconName: string) {
    rememberLucideIcon(iconName)
    setRecentIcons(readRecentLucideIcons())
    onChange(iconName)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
        <div className="bg-background border-border flex h-10 w-10 items-center justify-center rounded-md border">
          <SelectedIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{value || "Select icon"}</p>
          <p className="text-muted-foreground text-xs">Lucide icon name</p>
        </div>
      </div>

      <TextInput
        aria-controls={listboxId}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search icons..."
        type="search"
        value={query}
      />

      {!query.trim() && recentIcons.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Recent
          </p>
          <div className="flex flex-wrap gap-1">
            {recentIcons.map((iconName) => (
              <IconOption
                iconName={iconName}
                isSelected={value === iconName}
                key={`recent-${iconName}`}
                onSelect={() => selectIcon(iconName)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div
        aria-label="Icon results"
        className="border-border rounded-lg border p-2"
        id={listboxId}
        role="listbox"
      >
        {displayIcons.length === 0 ? (
          <p className="text-muted-foreground px-2 py-3 text-sm">No icons found.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-1">
              {displayIcons.map((iconName) => (
                <IconOption
                  iconName={iconName}
                  isSelected={value === iconName}
                  key={iconName}
                  onSelect={() => selectIcon(iconName)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"

import {
  SelectInput,
  TextInput,
} from "@/features/admin/components/forms/form-field"
import { cn } from "@/shared/lib/utils"

type ListToolbarProps = {
  placeholder?: string
  showStatusFilter?: boolean
  className?: string
}

export function ListToolbar({
  placeholder = "Search…",
  showStatusFilter = false,
  className,
}: ListToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const q = searchParams.get("q") ?? ""
  const status = searchParams.get("status") ?? "all"

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }

      startTransition(() => {
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname)
      })
    },
    [pathname, router, searchParams]
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        isPending && "opacity-70",
        className
      )}
    >
      <TextInput
        aria-label="Search"
        className="sm:max-w-xs"
        defaultValue={q}
        onChange={(event) => updateParams({ q: event.target.value || null })}
        placeholder={placeholder}
        type="search"
      />
      {showStatusFilter ? (
        <SelectInput
          aria-label="Filter by status"
          className="sm:w-40"
          onChange={(event) => updateParams({ status: event.target.value })}
          value={status}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </SelectInput>
      ) : null}
    </div>
  )
}

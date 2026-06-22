"use client"

import { caveatHandwriting } from "@/lib/fonts/caveat"
import { ProjectIcon } from "@/lib/icons/iconify"
import { cn } from "@/lib/utils"

export type ProjectLivePreviewValues = {
  title: string
  tagline: string
  icon_name: string
  year: string
  category: string
  role: string
  challenge: string
  solution: string
  impact: string
  hover_preview_enabled: boolean
}

type ProjectLivePreviewPanelProps = {
  values: ProjectLivePreviewValues
}

function PreviewSection({
  label,
  value,
}: {
  label: string
  value: string
}) {
  if (!value.trim()) {
    return null
  }

  return (
    <div className="space-y-1">
      <p className={cn("text-base font-semibold", caveatHandwriting.className)}>
        {label}
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">{value}</p>
    </div>
  )
}

export function ProjectLivePreviewPanel({ values }: ProjectLivePreviewPanelProps) {
  const metadata = [values.year, values.category, values.role]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" · ")

  return (
    <aside className="xl:sticky xl:top-6">
      <div className="border-border bg-card space-y-4 rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Live preview
        </p>

        <div className="bg-background border-border space-y-4 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
              <ProjectIcon className="h-5 w-5" iconName={values.icon_name || null} />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-medium">
                {values.title.trim() || "Project title"}
              </p>
              {values.tagline.trim() ? (
                <p className="text-muted-foreground text-sm">{values.tagline}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">Tagline preview</p>
              )}
            </div>
          </div>

          {metadata ? (
            <p className="text-muted-foreground text-xs">{metadata}</p>
          ) : (
            <p className="text-muted-foreground text-xs italic">Year · Category · Role</p>
          )}

          {values.hover_preview_enabled ? (
            <div className="space-y-3 border-t border-border pt-3">
              <PreviewSection label="Challenge" value={values.challenge} />
              <PreviewSection label="Solution" value={values.solution} />
              <PreviewSection label="Impact" value={values.impact} />
              {!values.challenge.trim() &&
              !values.solution.trim() &&
              !values.impact.trim() ? (
                <p className="text-muted-foreground text-sm italic">
                  Hover preview sections will appear here.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground border-t border-border pt-3 text-sm italic">
              Hover preview disabled
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}

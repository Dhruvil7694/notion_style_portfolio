"use client"

import dynamic from "next/dynamic"

import { BlockPreview } from "@/features/admin/components/block-preview"
import { FormField } from "@/features/admin/components/forms"
import type { ContentDocument } from "@/features/content/lib/schema"

const TiptapEditor = dynamic(
  () =>
    import("@/features/content/components/editor/tiptap-editor").then(
      (mod) => mod.TiptapEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="border-border bg-muted/30 text-muted-foreground rounded-lg border p-8 text-sm">
        Loading editor…
      </div>
    ),
  }
)

type AchievementsFieldProps = {
  value: ContentDocument
  onChange: (document: ContentDocument) => void
  error?: string
  label?: string
  hint?: string
}

export function AchievementsField({
  value,
  onChange,
  error,
  label = "Achievements",
  hint = "Use bullet lists for individual achievements. Each bullet becomes one entry on the public experience page.",
}: AchievementsFieldProps) {
  return (
    <FormField error={error} hint={hint} label={label} name="achievements">
      <div className="space-y-5">
        <TiptapEditor onChange={onChange} value={value} />
        <BlockPreview blocks={value.blocks} />
      </div>
    </FormField>
  )
}

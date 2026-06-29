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

type ContentFieldProps = {
  value: ContentDocument
  onChange: (document: ContentDocument) => void
  onAutosave?: (
    document: ContentDocument
  ) => Promise<{ success: boolean; error?: string }>
  autosaveEnabled?: boolean
  error?: string
  label?: string
  hint?: string
}

export function ContentField({
  value,
  onChange,
  onAutosave,
  autosaveEnabled = false,
  error,
  label = "Content",
  hint = "Rich text content stored as structured JSON blocks.",
}: ContentFieldProps) {
  return (
    <FormField error={error} hint={hint} label={label} name="content">
      <div className="space-y-4">
        <TiptapEditor
          autosaveEnabled={autosaveEnabled}
          onAutosave={onAutosave}
          onChange={onChange}
          value={value}
        />
        <BlockPreview blocks={value.blocks} />
      </div>
    </FormField>
  )
}

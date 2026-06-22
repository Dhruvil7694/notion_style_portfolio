"use client"

import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { TextInput } from "@/components/admin/forms"
import { buttonVariants } from "@/components/ui/button"
import { uploadProjectDemoImage } from "@/lib/admin/actions/uploads"
import {
  PROJECT_GALLERY_TYPE_LABELS,
  PROJECT_GALLERY_TYPES,
  type ProjectGalleryItem,
  type ProjectGalleryType,
} from "@/lib/public/project-gallery"
import { cn } from "@/lib/utils"

type ProjectGalleryFieldProps = {
  value: ProjectGalleryItem[]
  onChange: (value: ProjectGalleryItem[]) => void
  projectId?: string
  projectSlug?: string
  error?: string
}

export function ProjectGalleryField({
  value,
  onChange,
  projectId,
  projectSlug,
  error,
}: ProjectGalleryFieldProps) {
  const [uploadIndex, setUploadIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function updateItem(index: number, patch: Partial<ProjectGalleryItem>) {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    onChange([...value, { url: "", type: "screenshot", caption: "", alt: "" }])
  }

  function removeItem(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= value.length) {
      return
    }

    const next = [...value]
    const item = next.splice(index, 1)[0]
    if (!item) {
      return
    }
    next.splice(nextIndex, 0, item)
    onChange(next)
  }

  async function handleUpload(index: number, file: File) {
    setUploadIndex(index)
    setUploadError(null)

    const formData = new FormData()
    formData.append("file", file)
    if (projectId) {
      formData.append("projectId", projectId)
    }
    if (projectSlug) {
      formData.append("projectSlug", projectSlug)
    }

    const result = await uploadProjectDemoImage(formData)
    setUploadIndex(null)

    if (!result.success) {
      setUploadError(result.error)
      return
    }

    updateItem(index, { url: result.data.url })
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Images appear inside the case study narrative — not as a separate gallery page. Use types
        to control placement: screenshots under Problem, walkthrough types in the carousel, demos
        near Results.
      </p>

      {value.map((item, index) => (
        <div className="space-y-3 rounded-lg border border-border p-4" key={`gallery-${index}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6 shrink-0 text-center text-xs tabular-nums">
                {index + 1}
              </span>
              <p className="text-sm font-medium">Gallery item</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                aria-label="Move image up"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                disabled={index === 0}
                onClick={() => moveItem(index, -1)}
                type="button"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                aria-label="Move image down"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                disabled={index === value.length - 1}
                onClick={() => moveItem(index, 1)}
                type="button"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                aria-label="Remove image"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "text-muted-foreground hover:text-destructive"
                )}
                onClick={() => removeItem(index)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Type</span>
            <select
              className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              onChange={(event) =>
                updateItem(index, { type: event.target.value as ProjectGalleryType })
              }
              value={item.type}
            >
              {PROJECT_GALLERY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROJECT_GALLERY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              className="min-w-0 flex-1"
              onChange={(event) => updateItem(index, { url: event.target.value })}
              placeholder="https://..."
              value={item.url}
            />
            <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
              <Upload className="size-4" />
              {uploadIndex === index ? "Uploading…" : "Upload"}
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploadIndex !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void handleUpload(index, file)
                  }
                  event.target.value = ""
                }}
                type="file"
              />
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <TextInput
              onChange={(event) => updateItem(index, { caption: event.target.value })}
              placeholder="Caption (optional)"
              value={item.caption ?? ""}
            />
            <TextInput
              onChange={(event) => updateItem(index, { alt: event.target.value })}
              placeholder="Alt text (optional)"
              value={item.alt ?? ""}
            />
          </div>

          {item.url.trim() ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted/20">
              <Image
                alt={item.alt?.trim() || item.caption?.trim() || "Gallery preview"}
                className="object-contain"
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                src={item.url}
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border bg-muted/10">
              <ImageIcon className="text-muted-foreground size-8" />
            </div>
          )}
        </div>
      ))}

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addItem}
        type="button"
      >
        <Plus className="size-4" />
        Add gallery image
      </button>

      {uploadError ? <p className="text-destructive text-sm">{uploadError}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}

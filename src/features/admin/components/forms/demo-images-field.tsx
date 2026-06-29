"use client"

import { ImageIcon, Plus, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { TextInput, UrlInput } from "@/features/admin/components/forms"
import { uploadProjectDemoImage } from "@/features/admin/lib/actions/uploads"
import type { ProjectDemoImage } from "@/features/portfolio/lib/project-case-study"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type DemoImagesFieldProps = {
  value: ProjectDemoImage[]
  onChange: (value: ProjectDemoImage[]) => void
  projectId?: string
  projectSlug?: string
  error?: string
}

export function DemoImagesField({
  value,
  onChange,
  projectId,
  projectSlug,
  error,
}: DemoImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadIndex, setUploadIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function updateItem(
    index: number,
    field: keyof ProjectDemoImage,
    next: string
  ) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: next } : item
      )
    )
  }

  function addItem() {
    onChange([...value, { url: "", caption: "", alt: "" }])
  }

  function removeItem(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
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

    updateItem(index, "url", result.data.url)
  }

  return (
    <div className="space-y-5">
      {value.map((item, index) => (
        <div
          className="space-y-3 rounded-lg border border-border p-4"
          key={`demo-${index}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Image {index + 1}</p>
            <button
              aria-label="Remove image"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-destructive"
              )}
              onClick={() => removeItem(index)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <UrlInput
              className="min-w-0 flex-1"
              onChange={(event) => updateItem(index, "url", event.target.value)}
              placeholder="https://..."
              value={item.url}
            />
            <label
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer"
              )}
            >
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
              onChange={(event) =>
                updateItem(index, "caption", event.target.value)
              }
              placeholder="Caption (optional)"
              value={item.caption ?? ""}
            />
            <TextInput
              onChange={(event) => updateItem(index, "alt", event.target.value)}
              placeholder="Alt text (optional)"
              value={item.alt ?? ""}
            />
          </div>

          {item.url.trim() ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted/20">
              <Image
                alt={item.alt?.trim() || item.caption?.trim() || "Demo preview"}
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
        Add image
      </button>

      <input accept="image/*" className="sr-only" ref={inputRef} type="file" />

      {uploadError ? (
        <p className="text-destructive text-sm">{uploadError}</p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}

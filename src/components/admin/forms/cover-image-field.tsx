"use client"

import { ImageIcon, Link2, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { FormField, TextInput } from "@/components/admin/forms"
import { CoverImageCropDialog } from "@/components/admin/forms/cover-image-crop-dialog"
import { buttonVariants } from "@/components/ui/button"
import { uploadProjectCoverImage } from "@/lib/admin/actions/uploads"
import { cn } from "@/lib/utils"

type CoverImageFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  projectId?: string
  projectSlug?: string
}

type PendingCrop = {
  imageSrc: string
  fileName: string
  mimeType: string
  file: File
}

export function CoverImageField({
  value,
  onChange,
  error,
  projectId,
  projectSlug,
}: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null)

  const previewUrl = value.trim()

  function revokeCropSrc(src: string | undefined) {
    if (src?.startsWith("blob:")) {
      URL.revokeObjectURL(src)
    }
  }

  function closeCropDialog() {
    setPendingCrop((current) => {
      revokeCropSrc(current?.imageSrc)
      return null
    })
  }

  function openCropDialog(file: File) {
    setUploadError(null)
    setPreviewError(false)
    setPendingCrop((current) => {
      revokeCropSrc(current?.imageSrc)
      return {
        file,
        imageSrc: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type,
      }
    })
  }

  async function handleUpload(file: File) {
    setIsUploading(true)
    setUploadError(null)
    setPreviewError(false)

    const formData = new FormData()
    formData.append("file", file)
    if (projectId) {
      formData.append("projectId", projectId)
    }
    if (projectSlug) {
      formData.append("projectSlug", projectSlug)
    }

    const result = await uploadProjectCoverImage(formData)

    if (result.success) {
      onChange(result.data.url)
      closeCropDialog()
    } else {
      setUploadError(result.error)
    }

    setIsUploading(false)
  }

  return (
    <>
      <FormField
        error={error ?? uploadError ?? undefined}
        hint="Upload an image to crop and adjust, or paste a direct image URL."
        label="Cover image"
        name="cover_image"
      >
        <div className="space-y-3">
          <div className="border-border bg-muted/20 overflow-hidden rounded-lg border">
            {previewUrl && !previewError ? (
              <div className="bg-muted/30 flex aspect-video w-full items-center justify-center p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Cover preview"
                  className="max-h-full max-w-full object-contain"
                  onError={() => setPreviewError(true)}
                  src={previewUrl}
                />
              </div>
            ) : (
              <div className="text-muted-foreground flex aspect-video w-full flex-col items-center justify-center gap-2">
                <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
                <p className="text-sm">
                  {previewError ? "Could not load image preview" : "No cover image yet"}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading…" : "Upload image"}
            </button>

            {previewUrl ? (
              <>
                <a
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  href={previewUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Open link
                </a>
                <button
                  className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                  onClick={() => {
                    onChange("")
                    setPreviewError(false)
                  }}
                  type="button"
                >
                  Remove
                </button>
              </>
            ) : null}
          </div>

          <TextInput
            onChange={(event) => {
              setPreviewError(false)
              onChange(event.target.value)
            }}
            placeholder="https://example.com/cover.jpg"
            value={value}
          />

          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                openCropDialog(file)
              }
              event.target.value = ""
            }}
            ref={inputRef}
            type="file"
          />
        </div>
      </FormField>

      <CoverImageCropDialog
        fileName={pendingCrop?.fileName ?? "cover.jpg"}
        imageSrc={pendingCrop?.imageSrc ?? null}
        isProcessing={isUploading}
        mimeType={pendingCrop?.mimeType ?? "image/jpeg"}
        onCancel={closeCropDialog}
        onConfirm={(file) => void handleUpload(file)}
        open={Boolean(pendingCrop)}
        originalFile={pendingCrop?.file}
      />
    </>
  )
}

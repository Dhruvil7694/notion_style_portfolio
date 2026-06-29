"use client"

import { ImageIcon, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { FormField, UrlInput } from "@/features/admin/components/forms"
import {
  AvatarCropModal,
  type AvatarCropVariant,
  AvatarPreview,
} from "@/features/admin/components/forms/avatar-crop-modal"
import {
  updateAboutAvatar,
  updateOwnerAvatar,
} from "@/features/admin/lib/actions/settings"
import { uploadProfileAvatar } from "@/features/admin/lib/actions/uploads"
import {
  AVATAR_ABOUT_FRAME_SIZE_PX,
  AVATAR_ABOUT_MODAL_FRAME_SIZE_PX,
  AVATAR_FRAME_SIZE_PX,
  AVATAR_MODAL_FRAME_SIZE_PX,
  type AvatarCropTransform,
  blobToAvatarFile,
  renderAvatarCropBlob,
} from "@/shared/lib/images/avatar-crop"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type AvatarImageFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  variant?: AvatarCropVariant
}

type EditSession = {
  imageSrc: string
  fileName: string
  mimeType: string
}

const VARIANT_CONFIG = {
  profile: {
    label: "Homepage profile photo",
    name: "owner_avatar",
    hint: "Circular photo on the homepage. Saved immediately from the popup.",
    modalFrameSize: AVATAR_MODAL_FRAME_SIZE_PX,
    outputFrameSize: AVATAR_FRAME_SIZE_PX,
  },
  about: {
    label: "About Me photo",
    name: "owner_avatar_about",
    hint: "Square photo on the About page only. Separate from the homepage profile.",
    modalFrameSize: AVATAR_ABOUT_MODAL_FRAME_SIZE_PX,
    outputFrameSize: AVATAR_ABOUT_FRAME_SIZE_PX,
  },
} as const

async function persistAvatar(variant: AvatarCropVariant, url: string | null) {
  if (variant === "about") {
    return updateAboutAvatar(url)
  }

  return updateOwnerAvatar(url)
}

export function AvatarImageField({
  value,
  onChange,
  error,
  variant = "profile",
}: AvatarImageFieldProps) {
  const config = VARIANT_CONFIG[variant]
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [session, setSession] = useState<EditSession | null>(null)

  const previewUrl = value.trim()
  const isAbout = variant === "about"

  useEffect(() => {
    return () => {
      if (session?.imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(session.imageSrc)
      }
    }
  }, [session?.imageSrc])

  function revokeSessionSrc(src: string | undefined) {
    if (src?.startsWith("blob:")) {
      URL.revokeObjectURL(src)
    }
  }

  function openModal(source: EditSession) {
    setUploadError(null)
    setPreviewError(false)
    setSession((current) => {
      revokeSessionSrc(current?.imageSrc)
      return source
    })
  }

  function closeModal() {
    setSession((current) => {
      revokeSessionSrc(current?.imageSrc)
      return null
    })
  }

  async function handleRemove() {
    onChange("")
    setPreviewError(false)
    setUploadError(null)

    const result = await persistAvatar(variant, null)
    if (!result?.success) {
      setUploadError(result?.error ?? "Could not remove photo.")
      return
    }

    router.refresh()
  }

  async function handleSave(transform: AvatarCropTransform) {
    if (!session) {
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const blob = await renderAvatarCropBlob(session.imageSrc, transform, {
        editorFrameSize: config.modalFrameSize,
        outputFrameSize: config.outputFrameSize,
        mimeType: session.mimeType,
      })
      const extension = blob.type.split("/")[1] ?? "jpg"
      const baseName = session.fileName.replace(/\.[^.]+$/, "") || "avatar"
      const file = blobToAvatarFile(blob, `${baseName}-${variant}.${extension}`)
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadProfileAvatar(formData)

      if (result?.success) {
        const avatarUrl = result.data.url
        onChange(avatarUrl)

        const persist = await persistAvatar(variant, avatarUrl)
        if (!persist?.success) {
          setUploadError(
            persist?.error ?? "Photo uploaded but could not save to settings."
          )
          setIsUploading(false)
          return
        }

        closeModal()
        router.refresh()
      } else {
        setUploadError(result?.error ?? "Could not upload photo.")
      }
    } catch {
      setUploadError("Could not save photo. Try another image.")
    }

    setIsUploading(false)
  }

  return (
    <>
      <FormField
        error={error ?? uploadError ?? undefined}
        hint={config.hint}
        label={config.label}
        name={config.name}
      >
        <div className="space-y-3">
          {previewUrl && !previewError ? (
            <AvatarPreview
              imageSrc={previewUrl}
              onError={() => setPreviewError(true)}
              variant={variant}
            />
          ) : (
            <div
              className={cn(
                "text-muted-foreground border-border bg-muted/20 flex flex-col items-center justify-center gap-1 border border-dashed",
                isAbout
                  ? "h-[176px] w-[176px] rounded-[0.875rem]"
                  : "h-[104px] w-[104px] rounded-full"
              )}
            >
              <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
              <span className="text-[11px]">No photo</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? "Change photo" : "Upload photo"}
            </button>

            {previewUrl && !previewError ? (
              <>
                <button
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" })
                  )}
                  disabled={isUploading}
                  onClick={() =>
                    openModal({
                      fileName: "avatar.jpg",
                      imageSrc: previewUrl,
                      mimeType: "image/jpeg",
                    })
                  }
                  type="button"
                >
                  Adjust
                </button>
                <button
                  className={cn(
                    buttonVariants({ size: "sm", variant: "ghost" })
                  )}
                  disabled={isUploading}
                  onClick={() => void handleRemove()}
                  type="button"
                >
                  <X className="mr-1 h-4 w-4" />
                  Remove
                </button>
              </>
            ) : null}
          </div>

          <UrlInput
            onChange={(event) => {
              setPreviewError(false)
              onChange(event.target.value)
            }}
            placeholder="Or paste image URL"
            value={value}
          />

          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                openModal({
                  fileName: file.name,
                  imageSrc: URL.createObjectURL(file),
                  mimeType: file.type,
                })
              }
              event.target.value = ""
            }}
            ref={inputRef}
            type="file"
          />
        </div>
      </FormField>

      <AvatarCropModal
        imageSrc={session?.imageSrc ?? null}
        isProcessing={isUploading}
        onCancel={closeModal}
        onConfirm={(transform) => void handleSave(transform)}
        open={session !== null}
        variant={variant}
      />
    </>
  )
}

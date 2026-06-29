"use client"

import "react-image-crop/dist/ReactCrop.css"

import { useEffect, useRef, useState } from "react"
import ReactCrop, {
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop"

import { blobToFile, getCroppedImageBlob } from "@/shared/lib/images/crop"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type CoverImageCropDialogProps = {
  open: boolean
  imageSrc: string | null
  fileName: string
  mimeType: string
  originalFile?: File | null
  isProcessing?: boolean
  aspect?: number
  title?: string
  description?: string
  confirmLabel?: string
  fullImageLabel?: string
  onCancel: () => void
  onConfirm: (file: File) => void
}

export function CoverImageCropDialog({
  open,
  imageSrc,
  fileName,
  mimeType,
  originalFile,
  isProcessing = false,
  aspect,
  title = "Crop cover image",
  description = "Drag the border handles to resize the crop area, or move the selection.",
  confirmLabel = "Apply crop",
  fullImageLabel = "Use full image",
  onCancel,
  onConfirm,
}: CoverImageCropDialogProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isCropping, setIsCropping] = useState(false)
  const [cropError, setCropError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setCrop(undefined)
    setCompletedCrop(undefined)
    setCropError(null)
  }, [open, imageSrc])

  if (!open || !imageSrc) {
    return null
  }

  function getCenteredCrop(width: number, height: number) {
    if (!aspect) {
      return {
        x: 0,
        y: 0,
        width,
        height,
      }
    }

    let cropWidth = width
    let cropHeight = height

    if (width / height > aspect) {
      cropHeight = height
      cropWidth = height * aspect
    } else {
      cropWidth = width
      cropHeight = width / aspect
    }

    return {
      x: Math.max(0, (width - cropWidth) / 2),
      y: Math.max(0, (height - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight,
    }
  }

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = event.currentTarget
    const nextCrop = getCenteredCrop(width, height)

    setCrop({
      unit: "%",
      x: (nextCrop.x / width) * 100,
      y: (nextCrop.y / height) * 100,
      width: (nextCrop.width / width) * 100,
      height: (nextCrop.height / height) * 100,
    })
    setCompletedCrop({
      unit: "px",
      ...nextCrop,
    })
  }

  async function handleConfirm() {
    const image = imageRef.current
    const activeCrop =
      completedCrop ??
      (crop && image
        ? convertToPixelCrop(crop, image.width, image.height)
        : null)

    if (!imageSrc || !image || !activeCrop?.width || !activeCrop?.height) {
      return
    }

    setIsCropping(true)
    setCropError(null)

    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        activeCrop,
        mimeType,
        image.width,
        image.height
      )
      const extension = blob.type.split("/")[1] ?? "jpg"
      const baseName = fileName.replace(/\.[^.]+$/, "") || "cover"
      onConfirm(blobToFile(blob, `${baseName}-cropped.${extension}`))
    } catch {
      setCropError("Could not crop image. Try another file.")
    } finally {
      setIsCropping(false)
    }
  }

  const busy = isProcessing || isCropping

  return (
    <div
      aria-labelledby="cover-crop-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close crop dialog"
        className="absolute inset-0 bg-black/50"
        disabled={busy}
        onClick={onCancel}
        type="button"
      />

      <div
        className={cn(
          "bg-background border-border relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border shadow-lg"
        )}
      >
        <div className="border-border border-b px-5 py-4">
          <h2 className="text-lg font-semibold" id="cover-crop-dialog-title">
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>

        <div className="bg-muted/20 max-h-[min(70vh,720px)] overflow-auto p-4">
          <ReactCrop
            aspect={aspect}
            className="mx-auto max-w-full"
            crop={crop}
            keepSelection
            onChange={(nextCrop) => setCrop(nextCrop)}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Image to crop"
              className="block max-h-[min(68vh,680px)] w-auto max-w-full"
              onLoad={handleImageLoad}
              ref={imageRef}
              src={imageSrc}
            />
          </ReactCrop>
        </div>

        <div className="px-5 py-3">
          {cropError ? (
            <p className="text-destructive text-sm">{cropError}</p>
          ) : null}
        </div>

        <div className="border-border flex flex-wrap justify-end gap-2 border-t px-5 py-4">
          <Button
            disabled={busy}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          {originalFile ? (
            <Button
              disabled={busy}
              onClick={() => onConfirm(originalFile)}
              type="button"
              variant="secondary"
            >
              {busy ? "Uploading…" : fullImageLabel}
            </Button>
          ) : null}
          <Button
            disabled={busy || !completedCrop?.width || !completedCrop?.height}
            onClick={handleConfirm}
            type="button"
          >
            {busy ? "Applying…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

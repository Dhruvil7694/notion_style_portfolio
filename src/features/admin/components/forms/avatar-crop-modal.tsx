"use client"

import { useEffect, useRef, useState } from "react"

import {
  AVATAR_ABOUT_FRAME_SIZE_PX,
  AVATAR_ABOUT_MODAL_FRAME_SIZE_PX,
  AVATAR_FRAME_SIZE_PX,
  AVATAR_MODAL_FRAME_SIZE_PX,
  AVATAR_ZOOM_MAX,
  AVATAR_ZOOM_MIN,
  type AvatarCropTransform,
  clampAvatarTransform,
  DEFAULT_AVATAR_TRANSFORM,
  getAvatarScale,
  scaleAvatarTransform,
} from "@/shared/lib/images/avatar-crop"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

export type AvatarCropVariant = "profile" | "about"

type AvatarCropModalProps = {
  open: boolean
  imageSrc: string | null
  isProcessing?: boolean
  variant?: AvatarCropVariant
  onCancel: () => void
  onConfirm: (transform: AvatarCropTransform) => void
}

function AvatarCropFrame({
  frameSize,
  imageSrc,
  imageSize,
  transform,
  variant,
  interactive,
  onImageLoad,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  frameSize: number
  imageSrc: string
  imageSize: { width: number; height: number } | null
  transform: AvatarCropTransform
  variant: AvatarCropVariant
  interactive?: boolean
  onImageLoad?: (size: { width: number; height: number }) => void
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void
}) {
  const clamped = imageSize
    ? clampAvatarTransform(
        transform,
        imageSize.width,
        imageSize.height,
        frameSize
      )
    : transform
  const scale = imageSize
    ? getAvatarScale(imageSize.width, imageSize.height, frameSize, clamped.zoom)
    : 1
  const displayWidth = imageSize ? imageSize.width * scale : frameSize
  const displayHeight = imageSize ? imageSize.height * scale : frameSize
  const isCircle = variant === "profile"

  return (
    <div
      className={cn(
        "border-border bg-muted/30 relative overflow-hidden border",
        isCircle ? "rounded-full" : "rounded-[0.875rem]",
        interactive && "cursor-grab touch-none active:cursor-grabbing"
      )}
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ height: frameSize, width: frameSize }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        className="pointer-events-none absolute max-w-none select-none"
        draggable={false}
        onLoad={(event) => {
          onImageLoad?.({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }}
        src={imageSrc}
        style={
          imageSize
            ? {
                height: displayHeight,
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${clamped.offsetX}px), calc(-50% + ${clamped.offsetY}px))`,
                width: displayWidth,
              }
            : undefined
        }
      />
    </div>
  )
}

export function AvatarCropModal({
  open,
  imageSrc,
  isProcessing = false,
  variant = "profile",
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const [imageSize, setImageSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [transform, setTransform] = useState<AvatarCropTransform>(
    DEFAULT_AVATAR_TRANSFORM
  )

  const isAbout = variant === "about"
  const modalFrameSize = isAbout
    ? AVATAR_ABOUT_MODAL_FRAME_SIZE_PX
    : AVATAR_MODAL_FRAME_SIZE_PX
  const previewFrameSize = isAbout
    ? AVATAR_ABOUT_FRAME_SIZE_PX
    : AVATAR_FRAME_SIZE_PX

  useEffect(() => {
    if (!open) {
      return
    }

    setImageSize(null)
    setTransform(DEFAULT_AVATAR_TRANSFORM)
  }, [open, imageSrc])

  if (!open || !imageSrc) {
    return null
  }

  function updateTransform(next: Partial<AvatarCropTransform>) {
    if (!imageSize) {
      return
    }

    setTransform((current) =>
      clampAvatarTransform(
        {
          offsetX: next.offsetX ?? current.offsetX,
          offsetY: next.offsetY ?? current.offsetY,
          zoom: next.zoom ?? current.zoom,
        },
        imageSize.width,
        imageSize.height,
        modalFrameSize
      )
    )
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageSize) {
      return
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.offsetX,
      originY: transform.offsetY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    updateTransform({
      offsetX: drag.originX + (event.clientX - drag.startX),
      offsetY: drag.originY + (event.clientY - drag.startY),
    })
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const previewTransform = imageSize
    ? clampAvatarTransform(
        scaleAvatarTransform(transform, modalFrameSize, previewFrameSize),
        imageSize.width,
        imageSize.height,
        previewFrameSize
      )
    : transform

  return (
    <div
      aria-labelledby="avatar-crop-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        disabled={isProcessing}
        onClick={onCancel}
        type="button"
      />

      <div className="bg-background border-border relative w-full max-w-sm rounded-lg border p-5 shadow-lg">
        <h2 className="text-base font-semibold" id="avatar-crop-modal-title">
          {isAbout ? "Adjust About Me photo" : "Adjust homepage photo"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Full image at 1×. Drag to move, zoom in to crop.
        </p>

        <div className="mt-5 flex flex-col items-center gap-4">
          <AvatarCropFrame
            frameSize={modalFrameSize}
            imageSize={imageSize}
            imageSrc={imageSrc}
            interactive
            onImageLoad={setImageSize}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            transform={transform}
            variant={variant}
          />

          {imageSize ? (
            <div className="flex flex-col items-center gap-1">
              <AvatarCropFrame
                frameSize={previewFrameSize}
                imageSize={imageSize}
                imageSrc={imageSrc}
                transform={previewTransform}
                variant={variant}
              />
              <span className="text-muted-foreground text-[11px]">
                {isAbout ? "About page preview" : "Homepage preview"}
              </span>
            </div>
          ) : null}

          <label className="w-full space-y-1.5">
            <span className="text-muted-foreground text-xs">
              Zoom {transform.zoom.toFixed(2)}×
            </span>
            <input
              className="accent-primary w-full"
              disabled={!imageSize || isProcessing}
              max={AVATAR_ZOOM_MAX}
              min={AVATAR_ZOOM_MIN}
              onChange={(event) =>
                updateTransform({ zoom: Number.parseFloat(event.target.value) })
              }
              step="0.01"
              type="range"
              value={transform.zoom}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            disabled={isProcessing}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isProcessing || !imageSize}
            onClick={() => onConfirm(transform)}
            type="button"
          >
            {isProcessing ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AvatarPreview({
  imageSrc,
  onError,
  variant = "profile",
}: {
  imageSrc: string
  onError?: () => void
  variant?: AvatarCropVariant
}) {
  const isAbout = variant === "about"
  const size = isAbout ? AVATAR_ABOUT_FRAME_SIZE_PX : AVATAR_FRAME_SIZE_PX

  return (
    <div
      className={cn(
        "border-border bg-muted/30 relative overflow-hidden border",
        isAbout ? "rounded-[0.875rem]" : "rounded-full"
      )}
      style={{ height: size, width: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={isAbout ? "About photo preview" : "Profile preview"}
        className="h-full w-full object-cover"
        onError={onError}
        src={imageSrc}
      />
    </div>
  )
}

/** @deprecated Use AvatarPreview */
export const AvatarPreviewCircle = AvatarPreview

export type AvatarCropTransform = {
  offsetX: number
  offsetY: number
  zoom: number
}

export const AVATAR_FRAME_SIZE_PX = 104
export const AVATAR_ABOUT_FRAME_SIZE_PX = 176
export const AVATAR_MODAL_FRAME_SIZE_PX = 240
export const AVATAR_ABOUT_MODAL_FRAME_SIZE_PX = 280
export const AVATAR_EXPORT_SIZE_PX = 512
export const AVATAR_ZOOM_MIN = 1
export const AVATAR_ZOOM_MAX = 3
export const AVATAR_EXPORT_BG = "#0a0a0a"

export const DEFAULT_AVATAR_TRANSFORM: AvatarCropTransform = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
}

async function resolveImageSrc(
  imageSrc: string
): Promise<{ src: string; revoke?: () => void }> {
  if (imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")) {
    return { src: imageSrc }
  }

  const response = await fetch(imageSrc)
  if (!response.ok) {
    throw new Error("Failed to load image")
  }

  const blob = await response.blob()
  const src = URL.createObjectURL(blob)

  return {
    src,
    revoke: () => URL.revokeObjectURL(src),
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () =>
      reject(new Error("Failed to load image"))
    )
    image.src = url
  })
}

export function clampAvatarZoom(zoom: number): number {
  return Math.min(AVATAR_ZOOM_MAX, Math.max(AVATAR_ZOOM_MIN, zoom))
}

/** Zoom 1 fits the full image inside the circle; zoom in to crop tighter. */
export function getAvatarScale(
  imageWidth: number,
  imageHeight: number,
  frameSize: number,
  zoom: number
): number {
  const fitScale = Math.min(frameSize / imageWidth, frameSize / imageHeight)
  return fitScale * clampAvatarZoom(zoom)
}

export function clampAvatarTransform(
  transform: AvatarCropTransform,
  imageWidth: number,
  imageHeight: number,
  frameSize: number = AVATAR_FRAME_SIZE_PX
): AvatarCropTransform {
  const zoom = clampAvatarZoom(transform.zoom)
  const scale = getAvatarScale(imageWidth, imageHeight, frameSize, zoom)
  const displayWidth = imageWidth * scale
  const displayHeight = imageHeight * scale
  const maxOffsetX = Math.abs(displayWidth - frameSize) / 2
  const maxOffsetY = Math.abs(displayHeight - frameSize) / 2

  return {
    offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, transform.offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, transform.offsetY)),
    zoom,
  }
}

export function scaleAvatarTransform(
  transform: AvatarCropTransform,
  fromFrameSize: number,
  toFrameSize: number
): AvatarCropTransform {
  const ratio = toFrameSize / fromFrameSize

  return {
    offsetX: transform.offsetX * ratio,
    offsetY: transform.offsetY * ratio,
    zoom: transform.zoom,
  }
}

export async function renderAvatarCropBlob(
  imageSrc: string,
  transform: AvatarCropTransform,
  options?: {
    editorFrameSize?: number
    outputFrameSize?: number
    outputSize?: number
    mimeType?: string
  }
): Promise<Blob> {
  const editorFrameSize = options?.editorFrameSize ?? AVATAR_MODAL_FRAME_SIZE_PX
  const outputFrameSize = options?.outputFrameSize ?? AVATAR_FRAME_SIZE_PX
  const outputSize = options?.outputSize ?? AVATAR_EXPORT_SIZE_PX
  const mimeType = options?.mimeType ?? "image/jpeg"
  const outputTransform = scaleAvatarTransform(
    transform,
    editorFrameSize,
    outputFrameSize
  )
  const resolved = await resolveImageSrc(imageSrc)

  try {
    const image = await loadImage(resolved.src)
    const clamped = clampAvatarTransform(
      outputTransform,
      image.naturalWidth,
      image.naturalHeight,
      outputFrameSize
    )
    const scale = getAvatarScale(
      image.naturalWidth,
      image.naturalHeight,
      outputFrameSize,
      clamped.zoom
    )
    const displayWidth = image.naturalWidth * scale
    const displayHeight = image.naturalHeight * scale
    const exportScale = outputSize / outputFrameSize
    const exportDisplayWidth = displayWidth * exportScale
    const exportDisplayHeight = displayHeight * exportScale
    const left =
      outputSize / 2 - exportDisplayWidth / 2 + clamped.offsetX * exportScale
    const top =
      outputSize / 2 - exportDisplayHeight / 2 + clamped.offsetY * exportScale

    const canvas = document.createElement("canvas")
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not create image canvas")
    }

    context.fillStyle = AVATAR_EXPORT_BG
    context.fillRect(0, 0, outputSize, outputSize)
    context.drawImage(image, left, top, exportDisplayWidth, exportDisplayHeight)

    const outputType =
      mimeType === "image/png" || mimeType === "image/webp"
        ? mimeType
        : "image/jpeg"

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
            return
          }

          reject(new Error("Failed to export avatar image"))
        },
        outputType,
        0.92
      )
    })
  } finally {
    resolved.revoke?.()
  }
}

export function blobToAvatarFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

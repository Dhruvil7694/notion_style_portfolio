export type PixelCropArea = {
  x: number
  y: number
  width: number
  height: number
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () =>
      reject(new Error("Failed to load image"))
    )
    image.crossOrigin = "anonymous"
    image.src = url
  })
}

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCropArea,
  mimeType: string,
  displayWidth: number,
  displayHeight: number
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create image canvas")
  }

  const scaleX = image.naturalWidth / displayWidth
  const scaleY = image.naturalHeight / displayHeight

  const naturalCrop = {
    x: Math.round(pixelCrop.x * scaleX),
    y: Math.round(pixelCrop.y * scaleY),
    width: Math.round(pixelCrop.width * scaleX),
    height: Math.round(pixelCrop.height * scaleY),
  }

  canvas.width = naturalCrop.width
  canvas.height = naturalCrop.height

  context.drawImage(
    image,
    naturalCrop.x,
    naturalCrop.y,
    naturalCrop.width,
    naturalCrop.height,
    0,
    0,
    naturalCrop.width,
    naturalCrop.height
  )

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

        reject(new Error("Failed to export cropped image"))
      },
      outputType,
      0.92
    )
  })
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

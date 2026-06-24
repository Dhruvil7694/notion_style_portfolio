import type { StaticImageData } from "next/image"

const PROFILE_AVATAR_OPTIMIZED_WIDTH = 96

export function isStaticImageData(
  value: string | StaticImageData
): value is StaticImageData {
  return typeof value === "object" && value !== null && "src" in value
}

export function getSupabaseStorageHostname(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    return null
  }

  try {
    return new URL(supabaseUrl).hostname
  } catch {
    return null
  }
}

export function isSupabasePublicStorageUrl(src: string): boolean {
  const hostname = getSupabaseStorageHostname()

  if (!hostname) {
    return false
  }

  try {
    const url = new URL(src)

    return (
      url.hostname === hostname &&
      url.pathname.startsWith("/storage/v1/object/public/")
    )
  } catch {
    return false
  }
}

export function isNextImageOptimizable(src: string): boolean {
  if (src.startsWith("/")) {
    return true
  }

  return isSupabasePublicStorageUrl(src)
}

export function shouldUseUnoptimizedImage(
  src: string | StaticImageData
): boolean {
  if (isStaticImageData(src)) {
    return false
  }

  return !isNextImageOptimizable(src)
}

export function buildNextImageLoaderUrl(
  src: string,
  width: number,
  quality = 75
): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`
}

export function buildProfileAvatarPreloadHref(
  src: string | StaticImageData,
  quality = 75
): string | null {
  if (isStaticImageData(src)) {
    return null
  }

  if (!isNextImageOptimizable(src)) {
    return src
  }

  return buildNextImageLoaderUrl(src, PROFILE_AVATAR_OPTIMIZED_WIDTH, quality)
}

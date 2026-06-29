import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/features/seo/lib/constants"

export type OpenGraphImageDescriptor = {
  url: string
  width: number
  height: number
  alt: string
  type: string
}

export function buildOpenGraphImageUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const suffix = normalizedPath === "/" ? "" : normalizedPath

  return `${base}${suffix}/opengraph-image`
}

export function buildOpenGraphImageDescriptor(
  siteUrl: string,
  path: string,
  alt: string
): OpenGraphImageDescriptor {
  return {
    url: buildOpenGraphImageUrl(siteUrl, path),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt,
    type: OG_IMAGE_CONTENT_TYPE,
  }
}

export function resolveTwitterHandle(
  twitterUrl?: string | null
): string | undefined {
  if (!twitterUrl?.trim()) {
    return undefined
  }

  try {
    const url = new URL(twitterUrl)
    const segment = url.pathname.split("/").filter(Boolean)[0]
    return segment ? `@${segment.replace(/^@/, "")}` : undefined
  } catch {
    const handle = twitterUrl.replace(/^@/, "").trim()
    return handle ? `@${handle}` : undefined
  }
}

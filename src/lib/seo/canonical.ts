function normalizeSiteUrl(url?: string | null): string | undefined {
  const normalized = url?.trim().replace(/\/$/, "")
  return normalized || undefined
}

function isNonProductionHost(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes(".vercel.app")
  )
}

export function resolveSiteUrl(
  settingsUrl?: string | null
): string | undefined {
  const cmsUrl = normalizeSiteUrl(settingsUrl)
  const envUrl = normalizeSiteUrl(process.env.SITE_URL)

  // During domain cutover, prefer production SITE_URL when CMS still has a preview URL.
  if (
    cmsUrl &&
    envUrl &&
    isNonProductionHost(cmsUrl) &&
    !isNonProductionHost(envUrl)
  ) {
    return envUrl
  }

  return cmsUrl ?? envUrl
}

export function generateCanonicalUrl(siteUrl: string, path = ""): string {
  const base = siteUrl.replace(/\/$/, "")
  if (!path || path === "/") {
    return `${base}/`
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export function resolveCanonicalPath(path?: string): string {
  if (!path || path === "/") {
    return "/"
  }

  return path.startsWith("/") ? path : `/${path}`
}

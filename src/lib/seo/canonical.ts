export function resolveSiteUrl(settingsUrl?: string | null): string | undefined {
  const normalized = settingsUrl?.trim().replace(/\/$/, "")
  if (normalized) {
    return normalized
  }

  const envUrl = process.env.SITE_URL?.trim().replace(/\/$/, "")
  return envUrl || undefined
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

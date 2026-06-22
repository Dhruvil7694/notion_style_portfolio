type SecurityHeader = {
  key: string
  value: string
}

type BuildSecurityHeadersOptions = {
  supabaseOrigin?: string
  isProduction?: boolean
}

function joinSources(sources: Array<string | undefined>) {
  return sources.filter((source): source is string => Boolean(source)).join(" ")
}

export function buildContentSecurityPolicy(
  options: BuildSecurityHeadersOptions = {}
): string {
  const supabaseOrigin = options.supabaseOrigin?.replace(/\/$/, "")
  const scriptSrc = joinSources([
    "script-src 'self'",
    "'unsafe-inline'",
    "https://unpkg.com",
    options.isProduction ? undefined : "'unsafe-eval'",
  ])

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    joinSources([
      "img-src 'self' data: blob:",
      supabaseOrigin,
    ]),
    "font-src 'self' data:",
    joinSources([
      "connect-src 'self'",
      supabaseOrigin,
      "https://api.iconify.design",
      "https://unpkg.com",
    ]),
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
  ].join("; ")
}

export function buildSecurityHeaders(
  options: BuildSecurityHeadersOptions = {}
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(options),
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-DNS-Prefetch-Control",
      value: "on",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
    {
      key: "Cross-Origin-Resource-Policy",
      value: "same-site",
    },
  ]

  if (options.isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    })
  }

  return headers
}

export function buildSecurityHeadersRecord(
  options: BuildSecurityHeadersOptions = {}
): Record<string, string> {
  return Object.fromEntries(
    buildSecurityHeaders(options).map((header) => [header.key, header.value])
  )
}

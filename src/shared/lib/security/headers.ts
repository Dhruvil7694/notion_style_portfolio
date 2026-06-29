type SecurityHeader = {
  key: string
  value: string
}

type BuildSecurityHeadersOptions = {
  supabaseOrigin?: string
  isProduction?: boolean
  /** Vercel preview toolbar (feedback.js) — harmless on production custom domains */
  allowVercelLive?: boolean
}

function joinSources(sources: Array<string | undefined>) {
  return sources.filter((source): source is string => Boolean(source)).join(" ")
}

export function buildContentSecurityPolicy(
  options: BuildSecurityHeadersOptions = {}
): string {
  const supabaseOrigin = options.supabaseOrigin?.replace(/\/$/, "")
  const allowVercelLive = options.allowVercelLive ?? false

  const scriptSrc = joinSources([
    "script-src 'self'",
    "'unsafe-inline'",
    "https://unpkg.com",
    allowVercelLive ? "https://vercel.live" : undefined,
    options.isProduction ? "'wasm-unsafe-eval'" : "'unsafe-eval'",
  ])

  return [
    "default-src 'self'",
    scriptSrc,
    joinSources([
      "style-src 'self' 'unsafe-inline'",
      allowVercelLive ? "https://vercel.live" : undefined,
    ]),
    joinSources([
      "img-src 'self' data: blob:",
      supabaseOrigin,
      allowVercelLive ? "https://vercel.live https://vercel.com" : undefined,
    ]),
    joinSources([
      "font-src 'self' data:",
      allowVercelLive
        ? "https://vercel.live https://assets.vercel.com"
        : undefined,
    ]),
    joinSources([
      "connect-src 'self'",
      supabaseOrigin,
      "https://api.iconify.design",
      "https://unpkg.com",
      allowVercelLive
        ? "https://vercel.live wss://ws-us3.pusher.com"
        : undefined,
    ]),
    joinSources([
      "frame-src 'self'",
      allowVercelLive ? "https://vercel.live" : undefined,
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

import type { NextConfig } from "next"

import { buildSecurityHeaders } from "./src/lib/security/headers"

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : undefined

const securityHeaders = buildSecurityHeaders({
  supabaseOrigin,
  isProduction: process.env.NODE_ENV === "production",
})

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@joint/core", "@joint/react"],
  images: supabaseHostname
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
    middlewareClientMaxBodySize: "11mb",
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig

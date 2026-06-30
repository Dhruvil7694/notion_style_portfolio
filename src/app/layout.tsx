import "./globals.css"

import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { DEFAULT_PUBLIC_SETTINGS } from "@/features/portfolio/lib/settings"
import { SITE_THEME_DEFAULT } from "@/features/portfolio/lib/site-theme"
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_SITE_TITLE,
} from "@/features/seo/lib/constants"
import { FAVICON_METADATA } from "@/features/seo/lib/favicons"
import {
  buildBaseMetadata,
  buildSiteTitleConfig,
} from "@/features/seo/lib/metadata"
import { SiteThemeScript } from "@/features/site-shell/components/site-theme-script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

const rootMetadata = buildBaseMetadata(
  { settings: DEFAULT_PUBLIC_SETTINGS },
  {
    title: SEO_SITE_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    keywords: [...SEO_KEYWORDS],
  }
)

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export const metadata: Metadata = {
  title: buildSiteTitleConfig(),
  description: rootMetadata.description,
  keywords: rootMetadata.keywords,
  icons: FAVICON_METADATA,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
      data-site-theme={SITE_THEME_DEFAULT}
      suppressHydrationWarning
    >
      <head>
        <SiteThemeScript />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}

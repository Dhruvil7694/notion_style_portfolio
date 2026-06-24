import "./globals.css"

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { SiteThemeScript } from "@/components/public/site-theme-script"
import { DEFAULT_PUBLIC_SETTINGS } from "@/lib/public/settings"
import { SITE_THEME_DEFAULT } from "@/lib/public/site-theme"
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_SITE_TITLE,
} from "@/lib/seo/constants"
import { FAVICON_METADATA } from "@/lib/seo/favicons"
import { buildBaseMetadata, buildSiteTitleConfig } from "@/lib/seo/metadata"

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

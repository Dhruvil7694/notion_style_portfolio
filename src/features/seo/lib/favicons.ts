import type { Metadata } from "next"

const FAVICON_SIZES = [16, 32, 48] as const

/** Crawler-safe default (no media query). Google ignores prefers-color-scheme on favicons. */
const GOOGLE_FAVICON = {
  url: "/icons/favicon-48-dark.png",
  sizes: "48x48",
  type: "image/png",
} as const

/**
 * Theme-aware favicons generated from src/shared/assets/logo via npm run favicons:generate.
 * app/icon.png + app/apple-icon.png supply /favicon.ico for Google Search (Next.js file convention).
 */
export const FAVICON_METADATA: NonNullable<Metadata["icons"]> = {
  icon: [
    GOOGLE_FAVICON,
    ...FAVICON_SIZES.flatMap((size) => [
      {
        url: `/icons/favicon-${size}-light.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: `/icons/favicon-${size}-dark.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ]),
  ],
  apple: [
    {
      url: "/icons/apple-icon-light.png",
      sizes: "180x180",
      type: "image/png",
      media: "(prefers-color-scheme: light)",
    },
    {
      url: "/icons/apple-icon-dark.png",
      sizes: "180x180",
      type: "image/png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
}

import type { Metadata } from "next"

const FAVICON_SIZES = [16, 32, 48] as const

/** Theme-aware favicons generated from src/assets/logo via npm run favicons:generate */
export const FAVICON_METADATA: NonNullable<Metadata["icons"]> = {
  icon: [
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
    {
      url: "/icons/favicon-32-dark.png",
      sizes: "32x32",
      type: "image/png",
    },
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

import { ImageResponse } from "next/og"

import { OG_IMAGE_SIZE } from "@/features/seo/lib/constants"

export type OgImageLayoutProps = {
  title: string
  eyebrow?: string
  footer?: string
}

export function createOgImageResponse({
  title,
  eyebrow,
  footer = "Dhruvil Patel",
}: OgImageLayoutProps) {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "#09090b",
        color: "#fafafa",
        display: "flex",
        flexDirection: "column",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          color: "#a1a1aa",
          fontSize: 28,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow ?? "Portfolio"}
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          fontSize: title.length > 48 ? 56 : 72,
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          maxWidth: "960px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: "#d4d4d8",
          fontSize: 32,
          fontWeight: 500,
        }}
      >
        {footer}
      </div>
    </div>,
    {
      ...OG_IMAGE_SIZE,
    }
  )
}

export const ogImageRouteConfig = {
  alt: "Dhruvil Patel — Applied AI Engineer",
  size: OG_IMAGE_SIZE,
  contentType: "image/png",
} as const

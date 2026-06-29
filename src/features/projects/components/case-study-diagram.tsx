"use client"

import { useEffect, useId, useState } from "react"

import type { SiteTheme } from "@/features/portfolio/lib/site-theme"
import { formatUserFacingError } from "@/features/portfolio/lib/user-facing-error"
import { useSiteTheme } from "@/features/site-shell/components/site-theme-provider"
import { ErrorAlert } from "@/shared/components/error-alert"
import { cn } from "@/shared/lib/utils"

type CaseStudyDiagramProps = {
  source: string
  className?: string
}

function getMermaidThemeVariables(theme: SiteTheme) {
  if (theme === "light") {
    return {
      background: "transparent",
      primaryColor: "#f3e8da",
      primaryTextColor: "#000000",
      primaryBorderColor: "rgba(0, 0, 0, 0.18)",
      secondaryColor: "#faf1e7",
      secondaryTextColor: "#000000",
      secondaryBorderColor: "rgba(0, 0, 0, 0.18)",
      tertiaryColor: "#faf1e7",
      tertiaryTextColor: "#000000",
      tertiaryBorderColor: "rgba(0, 0, 0, 0.18)",
      lineColor: "rgba(0, 0, 0, 0.35)",
      textColor: "#000000",
      mainBkg: "#f3e8da",
      nodeBorder: "rgba(0, 0, 0, 0.18)",
      clusterBkg: "#faf1e7",
      titleColor: "#000000",
      edgeLabelBackground: "#faf1e7",
      fontFamily:
        "var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)",
      fontSize: "14px",
    }
  }

  return {
    background: "transparent",
    primaryColor: "#141414",
    primaryTextColor: "#fafafa",
    primaryBorderColor: "#333333",
    secondaryColor: "#141414",
    secondaryTextColor: "#a3a3a3",
    secondaryBorderColor: "#333333",
    tertiaryColor: "#0a0a0a",
    tertiaryTextColor: "#fafafa",
    tertiaryBorderColor: "#333333",
    lineColor: "#525252",
    textColor: "#fafafa",
    mainBkg: "#141414",
    nodeBorder: "#333333",
    clusterBkg: "#111111",
    titleColor: "#fafafa",
    edgeLabelBackground: "#141414",
    fontFamily: "var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)",
    fontSize: "14px",
  }
}

export function CaseStudyDiagram({ source, className }: CaseStudyDiagramProps) {
  const { theme } = useSiteTheme()
  const reactId = useId().replace(/:/g, "")
  const [svg, setSvg] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function renderDiagram() {
      const mermaid = (await import("mermaid")).default

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        themeVariables: getMermaidThemeVariables(theme),
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          padding: 20,
          nodeSpacing: 40,
          rankSpacing: 48,
          useMaxWidth: true,
        },
      })

      try {
        const { svg: rendered } = await mermaid.render(
          `case-study-diagram-${reactId}-${theme}`,
          source
        )

        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg("")
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Failed to render diagram"
          )
        }
      }
    }

    void renderDiagram()

    return () => {
      cancelled = true
    }
  }, [reactId, source, theme])

  if (error) {
    return (
      <ErrorAlert
        className={className}
        error={formatUserFacingError(error)}
        size="md"
      />
    )
  }

  if (!svg) {
    return (
      <div
        aria-hidden
        className={cn("case-study-diagram-loading", className)}
      />
    )
  }

  return (
    <div
      aria-label="System diagram"
      className={cn("case-study-diagram", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

"use client"

import { useEffect } from "react"

import type { AboutContent } from "@/features/about/lib/about-content"
import { useIsMobileViewport } from "@/shared/hooks/use-is-mobile-viewport"
import { caveatHandwriting } from "@/shared/lib/fonts/caveat"

import { AboutPortrait } from "./about-portrait"
import { AboutScrollParagraph } from "./about-scroll-paragraph"
import { AboutSnakeGame } from "./about-snake-game"

type AboutPageContentProps = {
  ownerName: string
  avatarUrl?: string | null
  about: AboutContent
}

export function AboutPageContent({ ownerName, about }: AboutPageContentProps) {
  const isMobile = useIsMobileViewport()
  const firstName = ownerName.split(/\s+/)[0] || ownerName

  useEffect(() => {
    const refresh = () => window.dispatchEvent(new Event("resize"))
    refresh()
    const timeoutId = window.setTimeout(refresh, 500)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <div className="about-page">
      <AboutPortrait name={ownerName} />

      <div className="about-scroll-stack">
        <AboutScrollParagraph lead>
          {about.intro} {about.intro_tools}
        </AboutScrollParagraph>

        <AboutScrollParagraph>{about.career_intro}</AboutScrollParagraph>

        <AboutScrollParagraph>{about.after_umbrella}</AboutScrollParagraph>

        <AboutScrollParagraph>{about.retrieval}</AboutScrollParagraph>

        <AboutScrollParagraph>{about.ownership}</AboutScrollParagraph>

        <AboutScrollParagraph>{about.outside}</AboutScrollParagraph>

        <AboutScrollParagraph>{about.mcp}</AboutScrollParagraph>
      </div>

      <p className={`about-signature ${caveatHandwriting.className}`}>
        {firstName}
      </p>

      <ul className="about-tags">
        {about.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      {!isMobile ? <AboutSnakeGame /> : null}
    </div>
  )
}

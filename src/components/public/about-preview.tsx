"use client"

import Link from "next/link"

import { FlipWords } from "@/components/ui/flip-words"
import type { AboutContent } from "@/lib/public/about-content"

type AboutPreviewProps = {
  about: AboutContent
}

export function AboutPreview({ about }: AboutPreviewProps) {
  return (
    <div className="workspace-about">
      <div className="workspace-bio">
        <p>{about.intro}</p>
        <p>
          Most of that happens with tools like{" "}
          <FlipWords
            className="workspace-flip-word"
            duration={2800}
            widthPadding={20}
            words={about.flip_keywords}
          />
          {", plus the usual debugging when retrieval goes sideways."}
        </p>
        <p>
          {about.career_intro}{" "}
          <Link className="about-more-link" href="/about">
            More about me
          </Link>
        </p>
      </div>
    </div>
  )
}

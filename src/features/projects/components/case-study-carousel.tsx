"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import type { ProjectGalleryItem } from "@/features/portfolio/lib/project-gallery"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type CaseStudyCarouselProps = {
  items: ProjectGalleryItem[]
  projectTitle: string
}

export function CaseStudyCarousel({
  items,
  projectTitle,
}: CaseStudyCarouselProps) {
  const [index, setIndex] = useState(0)

  if (items.length === 0) {
    return null
  }

  const item = items[index]
  if (!item) {
    return null
  }

  const alt =
    item.alt?.trim() ||
    item.caption?.trim() ||
    `${projectTitle} walkthrough ${index + 1}`

  function go(delta: number) {
    setIndex((current) => (current + delta + items.length) % items.length)
  }

  return (
    <div className="case-study-carousel">
      <div className="case-study-carousel-frame">
        <Image
          alt={alt}
          className="case-study-carousel-image"
          fill
          key={item.url}
          sizes="(max-width: 768px) 100vw, 720px"
          src={item.url}
        />
        {items.length > 1 ? (
          <>
            <button
              aria-label="Previous image"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "case-study-carousel-control case-study-carousel-control-prev"
              )}
              onClick={() => go(-1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label="Next image"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "case-study-carousel-control case-study-carousel-control-next"
              )}
              onClick={() => go(1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
      </div>

      <div className="case-study-carousel-meta">
        {item.caption?.trim() ? (
          <p className="case-study-carousel-caption">{item.caption}</p>
        ) : (
          <p className="case-study-carousel-caption">&nbsp;</p>
        )}
        {items.length > 1 ? (
          <p className="case-study-carousel-counter">
            {index + 1} / {items.length}
          </p>
        ) : null}
      </div>
    </div>
  )
}

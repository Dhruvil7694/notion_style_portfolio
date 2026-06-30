import Image from "next/image"

import type { ProjectGalleryItem } from "@/features/portfolio/lib/project-gallery"

type CaseStudyFigureProps = {
  item: ProjectGalleryItem
  projectTitle: string
  priority?: boolean
  className?: string
}

export function CaseStudyFigure({
  item,
  projectTitle,
  priority = false,
  className,
}: CaseStudyFigureProps) {
  const alt =
    item.alt?.trim() ||
    item.caption?.trim() ||
    `${projectTitle} ${item.type} image`

  return (
    <figure
      className={
        className ? `case-study-figure ${className}` : "case-study-figure"
      }
    >
      <div className="case-study-figure-frame">
        <Image
          alt={alt}
          className="case-study-figure-image"
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 720px"
          src={item.url}
        />
      </div>
      {item.caption?.trim() ? (
        <figcaption className="case-study-figure-caption">
          {item.caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

import Image from "next/image"

import type { ProjectDemoImage } from "@/features/portfolio/lib/project-case-study"

type DemoGalleryProps = {
  items: ProjectDemoImage[]
  projectTitle: string
}

export function DemoGallery({ items, projectTitle }: DemoGalleryProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="case-study-demo-gallery">
      {items.map((item, index) => {
        const alt =
          item.alt?.trim() ||
          item.caption?.trim() ||
          `${projectTitle} screenshot ${index + 1}`

        return (
          <figure
            className="case-study-demo-figure"
            key={`${item.url}-${index}`}
          >
            <div className="case-study-demo-image-wrap">
              <Image
                alt={alt}
                className="case-study-demo-image"
                height={720}
                src={item.url}
                unoptimized
                width={1280}
              />
            </div>
            {item.caption?.trim() ? (
              <figcaption className="case-study-demo-caption">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        )
      })}
    </div>
  )
}

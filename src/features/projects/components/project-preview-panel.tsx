"use client"

import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

import { glassPanelClass } from "@/features/portfolio/lib/glass-panel"
import {
  getProjectPreviewDescription,
  getProjectPreviewImage,
  type ProjectListPreviewItem,
} from "@/features/portfolio/lib/project-preview-sections"
import { cn } from "@/shared/lib/utils"

const SAMPLE_PROJECT_IMAGE = "/sample_image.png"

const CARD_WIDTH = 400
const VIEWPORT_PADDING = 16
const SECTION_GAP = 24
const PANEL_LEFT_OFFSET = 120
const PANEL_VERTICAL_SHIFT = 56
const MOBILE_BREAKPOINT = 768

type PanelPosition = {
  left: number
  top: number
  width: number
}

type ProjectPreviewPanelProps = {
  project: ProjectListPreviewItem | null
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  previewId: string
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function computePanelPosition(anchor: DOMRect): PanelPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const sectionCenterY = anchor.top + anchor.height / 2

  if (viewportWidth <= MOBILE_BREAKPOINT) {
    const width = viewportWidth - VIEWPORT_PADDING * 2
    const top = Math.min(
      anchor.bottom + SECTION_GAP,
      viewportHeight - VIEWPORT_PADDING
    )

    return {
      left: VIEWPORT_PADDING,
      top,
      width,
    }
  }

  const spaceRight = viewportWidth - anchor.right - VIEWPORT_PADDING
  const rawLeft =
    spaceRight >= CARD_WIDTH + SECTION_GAP
      ? anchor.right + SECTION_GAP
      : viewportWidth - CARD_WIDTH - VIEWPORT_PADDING

  const left = Math.max(VIEWPORT_PADDING, rawLeft - PANEL_LEFT_OFFSET)

  const top = Math.max(
    VIEWPORT_PADDING,
    Math.min(
      sectionCenterY - PANEL_VERTICAL_SHIFT,
      viewportHeight - VIEWPORT_PADDING
    )
  )

  return {
    left,
    top,
    width: CARD_WIDTH,
  }
}

export function ProjectPreviewPanel({
  project,
  anchorRef,
  open,
  previewId,
  onMouseEnter,
  onMouseLeave,
}: ProjectPreviewPanelProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [imageHovered, setImageHovered] = useState(false)
  const [position, setPosition] = useState<PanelPosition>({
    left: 0,
    top: 0,
    width: CARD_WIDTH,
  })
  const positionLockedRef = useRef(false)

  const description = project ? getProjectPreviewDescription(project) : null
  const imageSrc = project
    ? (getProjectPreviewImage(project) ?? SAMPLE_PROJECT_IMAGE)
    : SAMPLE_PROJECT_IMAGE
  const href = project ? `/projects/${project.slug}` : "#"

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    setPosition(computePanelPosition(anchor.getBoundingClientRect()))
  }, [anchorRef])

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false)
      setImageHovered(false)
      positionLockedRef.current = false
      return
    }

    if (!positionLockedRef.current) {
      updatePosition()
      positionLockedRef.current = true
    }

    setVisible(true)
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleViewportChange() {
      updatePosition()
    }

    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [open, updatePosition])

  if (!mounted || !open || !project) {
    return null
  }

  return createPortal(
    <div className="project-preview-root">
      <article
        className={cn(
          "project-preview-card",
          glassPanelClass,
          visible && "is-visible",
          imageHovered && "is-image-hovered"
        )}
        id={previewId}
        onMouseEnter={onMouseEnter}
        onMouseLeave={() => {
          setImageHovered(false)
          onMouseLeave()
        }}
        role="dialog"
        aria-label={`${project.title} preview`}
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
        }}
      >
        <div className="project-preview-card-media">
          <Link
            className="project-preview-card-image-frame"
            href={href}
            onMouseEnter={() => setImageHovered(true)}
            onMouseLeave={() => setImageHovered(false)}
          >
            <Image
              alt=""
              className="project-preview-card-image"
              fill
              priority
              sizes="400px"
              src={imageSrc}
              unoptimized={imageSrc.startsWith("http")}
            />
          </Link>
        </div>

        <div className="project-preview-card-content">
          <Link
            className="project-preview-card-heading"
            href={href}
            onMouseEnter={() => setImageHovered(true)}
            onMouseLeave={() => setImageHovered(false)}
          >
            <h3 className="project-preview-card-title">
              <span>{project.title}</span>
              <ArrowUpRight
                aria-hidden
                className="project-preview-card-title-arrow"
                strokeWidth={2}
              />
            </h3>
          </Link>

          {description ? (
            <p className="project-preview-card-description">{description}</p>
          ) : null}

          <Link className="project-preview-card-more" href={href}>
            View more
          </Link>
        </div>
      </article>
    </div>,
    document.body
  )
}

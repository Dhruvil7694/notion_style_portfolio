"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"

import {
  flattenTechStackItems,
  TechStackCategories,
} from "@/features/knowledge-base/components/tech-stack-categories"
import type { ProjectTechStackGroup } from "@/features/portfolio/lib/project-case-study"

import { StaticCaseStudyBlock } from "./collapsible-case-study-block"
import { TechStackListPanel } from "./tech-stack-list-panel"
import { TechStackListToggle } from "./tech-stack-list-toggle"

type TechStackSectionProps = {
  groups: ProjectTechStackGroup[]
}

export function TechStackSection({ groups }: TechStackSectionProps) {
  const [listOpen, setListOpen] = useState(false)
  const panelId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const items = useMemo(() => flattenTechStackItems(groups), [groups])

  useEffect(() => {
    if (!listOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setListOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [listOpen])

  return (
    <>
      <StaticCaseStudyBlock
        fullWidthContent
        icon="techStack"
        title="Tech Stack"
        titleAction={
          items.length > 0 ? (
            <TechStackListToggle
              onOpenChange={setListOpen}
              open={listOpen}
              panelId={panelId}
              toggleRef={toggleRef}
            />
          ) : null
        }
      >
        <TechStackCategories groups={groups} />
      </StaticCaseStudyBlock>

      <TechStackListPanel
        id={panelId}
        items={items}
        open={listOpen}
        toggleRef={toggleRef}
      />
    </>
  )
}

"use client"

import { BlockRenderer } from "@/features/content/components/block-renderer"
import { richTextToPlainText } from "@/features/content/lib/inline"
import type { ContentBlock } from "@/features/content/lib/schema"
import {
  type CaseStudyBlockIconName,
  CollapsibleCaseStudyBlock,
} from "@/features/projects/components/collapsible-case-study-block"

type RichContentSection = {
  title: string
  blocks: ContentBlock[]
}

type RichContentSectionsProps = {
  blocks: ContentBlock[]
}

export function RichContentSections({ blocks }: RichContentSectionsProps) {
  const { preamble, sections } = groupBlocksByHeading(blocks)

  if (preamble.length === 0 && sections.length === 0) {
    return null
  }

  return (
    <>
      {preamble.length > 0 ? (
        <CollapsibleCaseStudyBlock icon="content" title="Additional Details">
          <BlockRenderer blocks={preamble} className="case-study-rich-blocks" />
        </CollapsibleCaseStudyBlock>
      ) : null}
      {sections.map((section) => (
        <CollapsibleCaseStudyBlock
          icon={resolveRichSectionIcon(section.title)}
          key={section.title}
          title={section.title}
        >
          <BlockRenderer
            blocks={section.blocks}
            className="case-study-rich-blocks"
          />
        </CollapsibleCaseStudyBlock>
      ))}
    </>
  )
}

function groupBlocksByHeading(blocks: ContentBlock[]) {
  const preamble: ContentBlock[] = []
  const sections: RichContentSection[] = []
  let current: RichContentSection | null = null

  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      if (current) {
        sections.push(current)
      }
      current = {
        title: richTextToPlainText(block.content).trim(),
        blocks: [],
      }
      continue
    }

    if (current) {
      current.blocks.push(block)
    } else {
      preamble.push(block)
    }
  }

  if (current) {
    sections.push(current)
  }

  return { preamble, sections }
}

function resolveRichSectionIcon(title: string): CaseStudyBlockIconName {
  const lower = title.toLowerCase()
  if (lower.includes("research") || lower.includes("context")) {
    return "research"
  }
  if (
    lower.includes("shipped") ||
    lower.includes("delivered") ||
    lower.includes("built")
  ) {
    return "shipped"
  }
  return "content"
}

import { z } from "zod"

import {
  architectureDiagramBlockSchema,
  calloutBlockSchema,
  type ContentBlock,
  expandableBlockSchema,
  glossaryTermBlockSchema,
  mentionBlockSchema,
  normalizeContentBlock,
  projectReferenceBlockSchema,
} from "@/lib/content/schema"

export const componentRegistry = {
  callout: {
    type: "callout" as const,
    schema: calloutBlockSchema,
    label: "Callout",
  },
  project_reference: {
    type: "project_reference" as const,
    schema: projectReferenceBlockSchema,
    label: "Project Reference",
  },
  glossary_term: {
    type: "glossary_term" as const,
    schema: glossaryTermBlockSchema,
    label: "Glossary Term",
  },
  expandable_section: {
    type: "expandable" as const,
    schema: expandableBlockSchema,
    label: "Expandable Section",
  },
  architecture_diagram: {
    type: "architecture_diagram" as const,
    schema: architectureDiagramBlockSchema,
    label: "Architecture Diagram",
  },
  mention: {
    type: "mention" as const,
    schema: mentionBlockSchema,
    label: "Mention",
  },
} as const

export type ComponentRegistryKey = keyof typeof componentRegistry

export function validateComponentBlock(block: unknown): ContentBlock | null {
  const parsed = z
    .union([
      calloutBlockSchema,
      glossaryTermBlockSchema,
      projectReferenceBlockSchema,
      mentionBlockSchema,
      architectureDiagramBlockSchema,
      expandableBlockSchema,
    ])
    .safeParse(block)

  return parsed.success ? normalizeContentBlock(parsed.data) : null
}

export function isKnownBlockType(type: string): type is ContentBlock["type"] {
  return [
    "paragraph",
    "heading",
    "bullet_list",
    "numbered_list",
    "quote",
    "code",
    "divider",
    "link",
    "callout",
    "glossary_term",
    "project_reference",
    "mention",
    "architecture_diagram",
    "expandable",
  ].includes(type)
}

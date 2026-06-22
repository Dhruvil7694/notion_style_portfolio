import { z } from "zod"

import { richTextSchema } from "./inline"

export const CONTENT_VERSION = 1 as const

export const calloutVariantSchema = z.enum(["info", "success", "warning", "danger"])

export const architectureNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  x: z.number().optional(),
  y: z.number().optional(),
})

export const architectureEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
})

export const architectureDiagramSchema = z.object({
  nodes: z.array(architectureNodeSchema).min(1),
  edges: z.array(architectureEdgeSchema),
})

export const headingLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
])

export const paragraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  content: richTextSchema,
})

export const headingBlockSchema = z.object({
  type: z.literal("heading"),
  level: headingLevelSchema,
  content: richTextSchema,
})

export const bulletListBlockSchema = z.object({
  type: z.literal("bullet_list"),
  items: z.array(z.string()).min(1),
})

export const numberedListBlockSchema = z.object({
  type: z.literal("numbered_list"),
  items: z.array(z.string()).min(1),
})

export const quoteBlockSchema = z.object({
  type: z.literal("quote"),
  content: richTextSchema,
})

export const codeBlockSchema = z.object({
  type: z.literal("code"),
  content: z.string(),
  language: z.string().optional(),
})

export const dividerBlockSchema = z.object({
  type: z.literal("divider"),
})

export const linkBlockSchema = z.object({
  type: z.literal("link"),
  href: z.string().url(),
  label: z.string().min(1),
})

export const calloutBlockSchema = z.object({
  type: z.literal("callout"),
  variant: calloutVariantSchema,
  content: richTextSchema,
})

export const glossaryTermBlockSchema = z.object({
  type: z.literal("glossary_term"),
  term: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

export const projectReferenceBlockSchema = z.object({
  type: z.literal("project_reference"),
  project_id: z.string().uuid(),
})

export const mentionBlockSchema = z.object({
  type: z.literal("mention"),
  label: z.string().min(1),
  href: z.string().url().optional(),
  description: z.string().optional(),
})

export const architectureDiagramBlockSchema = z.object({
  type: z.literal("architecture_diagram"),
  nodes: architectureDiagramSchema.shape.nodes,
  edges: architectureDiagramSchema.shape.edges,
})

export const expandableBlockSchema = z.object({
  type: z.literal("expandable"),
  title: z.string().min(1),
  content: z.array(z.record(z.string(), z.unknown())),
})

export const leafContentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlockSchema,
  headingBlockSchema,
  bulletListBlockSchema,
  numberedListBlockSchema,
  quoteBlockSchema,
  codeBlockSchema,
  dividerBlockSchema,
  linkBlockSchema,
  calloutBlockSchema,
  glossaryTermBlockSchema,
  projectReferenceBlockSchema,
  mentionBlockSchema,
  architectureDiagramBlockSchema,
])

export const contentBlockSchema = z.union([
  leafContentBlockSchema,
  expandableBlockSchema,
])

export const contentDocumentSchema = z.object({
  version: z.literal(CONTENT_VERSION),
  blocks: z.array(contentBlockSchema),
})

export type RawContentBlock = z.infer<typeof contentBlockSchema>
export type RawContentDocument = z.infer<typeof contentDocumentSchema>

export type NormalizedExpandableBlock = {
  type: "expandable"
  title: string
  content: NormalizedContentBlock[]
}

export type NormalizedContentBlock =
  | Exclude<RawContentBlock, { type: "expandable" }>
  | NormalizedExpandableBlock

export type ContentBlock = NormalizedContentBlock
export type ContentDocument = {
  version: typeof CONTENT_VERSION
  blocks: ContentBlock[]
}
export type BlockType = ContentBlock["type"]
export type CalloutVariant = z.infer<typeof calloutVariantSchema>
export type ArchitectureNode = z.infer<typeof architectureNodeSchema>
export type ArchitectureEdge = z.infer<typeof architectureEdgeSchema>

export const blockTypeSchema = z.enum([
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
])

export function createEmptyDocument(): ContentDocument {
  return { version: CONTENT_VERSION, blocks: [] }
}

export function normalizeContentBlock(block: RawContentBlock): NormalizedContentBlock {
  if (block.type !== "expandable") {
    return block
  }

  const nested: NormalizedContentBlock[] = []
  for (const item of block.content) {
    const parsed = contentBlockSchema.safeParse(item)
    if (parsed.success) {
      nested.push(normalizeContentBlock(parsed.data))
    }
  }

  return {
    type: "expandable",
    title: block.title,
    content: nested,
  }
}

export function normalizeContentDocument(document: RawContentDocument): ContentDocument {
  return {
    version: document.version,
    blocks: document.blocks.map(normalizeContentBlock),
  }
}

export function extractProjectIds(document: ContentDocument): string[] {
  const ids = new Set<string>()

  function walk(blocks: ContentBlock[]) {
    for (const block of blocks) {
      if (block.type === "project_reference") {
        ids.add(block.project_id)
      }
      if (block.type === "expandable") {
        walk(block.content)
      }
    }
  }

  walk(document.blocks)
  return [...ids]
}

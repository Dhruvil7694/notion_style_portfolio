import { z } from "zod"

import type { RichText } from "./inline"
import { richTextToPlainText } from "./inline"
import {
  CONTENT_VERSION,
  type ContentBlock,
  contentBlockSchema,
  type ContentDocument,
  contentDocumentSchema,
  createEmptyDocument,
  normalizeContentBlock,
  normalizeContentDocument,
} from "./schema"

export type ContentParseResult =
  | { success: true; data: ContentDocument }
  | { success: false; error: string; data: ContentDocument }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isLegacyTiptapDoc(value: unknown): value is { type: "doc"; content?: unknown[] } {
  return isRecord(value) && value.type === "doc"
}

function extractTextFromTiptapNode(node: unknown): string {
  if (!isRecord(node)) {
    return ""
  }

  if (node.type === "text" && typeof node.text === "string") {
    return node.text
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromTiptapNode).join("")
  }

  return ""
}

function convertLegacyTiptapDoc(raw: { type: "doc"; content?: unknown[] }): ContentBlock[] {
  const nodes = raw.content ?? []
  const blocks: ContentBlock[] = []

  for (const node of nodes) {
    if (!isRecord(node) || typeof node.type !== "string") {
      continue
    }

    const text = extractTextFromTiptapNode(node).trim()
    if (!text) {
      continue
    }

    if (node.type === "heading") {
      const level = typeof node.attrs === "object" && node.attrs !== null
        ? Number((node.attrs as Record<string, unknown>).level)
        : 2
      const safeLevel = level === 1 || level === 2 || level === 3 ? level : 2
      blocks.push({ type: "heading", level: safeLevel, content: text })
      continue
    }

    if (node.type === "paragraph" || node.type === "text") {
      blocks.push({ type: "paragraph", content: text })
    }
  }

  return blocks
}

function normalizeRawContent(raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return createEmptyDocument()
  }

  if (Array.isArray(raw)) {
    return { version: CONTENT_VERSION, blocks: raw }
  }

  if (isRecord(raw) && Object.keys(raw).length === 0) {
    return createEmptyDocument()
  }

  if (isLegacyTiptapDoc(raw)) {
    return { version: CONTENT_VERSION, blocks: convertLegacyTiptapDoc(raw) }
  }

  return raw
}

export function serializeContent(document: ContentDocument): ContentDocument {
  const cleaned: ContentDocument = {
    version: CONTENT_VERSION,
    blocks: document.blocks
      .map(sanitizeBlock)
      .filter((block): block is ContentBlock => block !== null),
  }

  const parsed = contentDocumentSchema.safeParse(cleaned)
  if (!parsed.success) {
    return { version: CONTENT_VERSION, blocks: [] }
  }

  return normalizeContentDocument(parsed.data)
}

function sanitizeRichText(content: RichText): boolean {
  return richTextToPlainText(content).trim().length > 0
}

function sanitizeBlock(block: ContentBlock): ContentBlock | null {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
    case "callout":
      return sanitizeRichText(block.content) ? block : null
    case "bullet_list":
    case "numbered_list": {
      const items = block.items.map((item) => item.trim()).filter(Boolean)
      return items.length > 0 ? { ...block, items } : null
    }
    case "code":
      return block.content.trim() ? block : null
    case "divider":
      return block
    case "link":
      return block.label.trim() && block.href.trim() ? block : null
    case "glossary_term":
      return block.term.trim() && block.title.trim() && block.description.trim()
        ? block
        : null
    case "project_reference":
      return z.string().uuid().safeParse(block.project_id).success ? block : null
    case "mention":
      return block.label.trim() ? block : null
    case "architecture_diagram":
      return block.nodes.length > 0 ? block : null
    case "expandable": {
      const nested: ContentBlock[] = []
      for (const item of block.content) {
        const parsed = contentBlockSchema.safeParse(item)
        if (!parsed.success) {
          continue
        }
        const normalized = normalizeContentBlock(parsed.data)
        const sanitized = sanitizeBlock(normalized)
        if (sanitized) {
          nested.push(sanitized)
        }
      }
      return block.title.trim() && nested.length > 0
        ? { type: "expandable", title: block.title, content: nested }
        : null
    }
    default:
      return null
  }
}

export function deserializeContent(raw: unknown): ContentDocument {
  return safeParseContent(raw).data
}

export function validateContent(raw: unknown): ContentDocument {
  const normalized = normalizeRawContent(raw)
  return normalizeContentDocument(contentDocumentSchema.parse(normalized))
}

export function safeParseContent(raw: unknown): ContentParseResult {
  const fallback = createEmptyDocument()

  try {
    const normalized = normalizeRawContent(raw)
    const parsed = contentDocumentSchema.safeParse(normalized)

    if (parsed.success) {
      return { success: true, data: normalizeContentDocument(parsed.data) }
    }

    const message = parsed.error.issues[0]?.message ?? "Invalid content structure"
    return { success: false, error: message, data: fallback }
  } catch {
    return { success: false, error: "Unable to parse content", data: fallback }
  }
}

export function parseBlocks(blocks: unknown): ContentBlock[] {
  return z
    .array(contentBlockSchema)
    .parse(blocks)
    .map((block) => normalizeContentBlock(block))
}

import type { JSONContent } from "@tiptap/react"

import { ARCHITECTURE_PRESETS } from "@/features/content/lib/components/architecture-presets"
import {
  inlineMarksToTiptap,
  type InlineSpan,
  mergeAdjacentSpans,
  normalizeRichText,
  type RichText,
  richTextToPlainText,
  tiptapMarksToInlineMarks,
} from "@/features/content/lib/inline"
import {
  CONTENT_VERSION,
  type ContentBlock,
  type ContentDocument,
  contentDocumentSchema,
  normalizeContentDocument,
} from "@/features/content/lib/schema"
import { serializeContent } from "@/features/content/lib/serializer"

export type EditorValidationResult =
  | { success: true; data: ContentDocument }
  | { success: false; error: string; data: ContentDocument }

function parseJsonAttr<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function tiptapInlineToSpans(nodes: JSONContent[] | undefined): InlineSpan[] {
  const spans: InlineSpan[] = []

  for (const node of nodes ?? []) {
    if (node.type !== "text" || !node.text) {
      continue
    }

    const { marks, href } = tiptapMarksToInlineMarks(node.marks)
    spans.push({
      text: node.text,
      marks,
      href,
    })
  }

  return mergeAdjacentSpans(spans)
}

function spansToTiptapInline(spans: InlineSpan[]): JSONContent[] {
  return normalizeRichText(spans).map((span) => ({
    type: "text",
    text: span.text,
    marks: inlineMarksToTiptap(span),
  }))
}

function richTextFromTiptap(nodes: JSONContent[] | undefined): RichText {
  const spans = tiptapInlineToSpans(nodes)
  return spans.length > 0 ? spans : ""
}

function richTextFromJsonAttr(value: unknown): RichText {
  const parsed = parseJsonAttr<RichText | InlineSpan[]>(value, "")
  if (typeof parsed === "string") {
    return parsed
  }
  if (Array.isArray(parsed)) {
    return parsed
  }
  return ""
}

function extractListItems(listNode: JSONContent): string[] {
  const items: string[] = []

  for (const listItem of listNode.content ?? []) {
    if (listItem.type !== "listItem") {
      continue
    }

    const text = richTextToPlainText(
      richTextFromTiptap(listItem.content?.[0]?.content)
    )
    if (text.trim()) {
      items.push(text.trim())
    }
  }

  return items
}

function paragraphToBlock(node: JSONContent): ContentBlock | null {
  const spans = tiptapInlineToSpans(node.content)

  if (spans.length === 0) {
    return null
  }

  if (
    spans.length === 1 &&
    spans[0]?.marks?.length === 1 &&
    spans[0].marks[0] === "link" &&
    spans[0].href
  ) {
    try {
      new URL(spans[0].href)
      return { type: "link", href: spans[0].href, label: spans[0].text.trim() }
    } catch {
      // Keep as paragraph with inline link span.
    }
  }

  return { type: "paragraph", content: spans }
}

function tiptapNodeToBlock(node: JSONContent): ContentBlock | null {
  switch (node.type) {
    case "paragraph":
      return paragraphToBlock(node)

    case "heading": {
      const level = node.attrs?.level
      const safeLevel = level === 1 || level === 2 || level === 3 ? level : 2
      const content = richTextFromTiptap(node.content)
      return richTextToPlainText(content).trim()
        ? { type: "heading", level: safeLevel, content }
        : null
    }

    case "bulletList": {
      const items = extractListItems(node)
      return items.length > 0 ? { type: "bullet_list", items } : null
    }

    case "orderedList": {
      const items = extractListItems(node)
      return items.length > 0 ? { type: "numbered_list", items } : null
    }

    case "blockquote": {
      const content = richTextFromTiptap(node.content?.[0]?.content)
      return richTextToPlainText(content).trim()
        ? { type: "quote", content }
        : null
    }

    case "codeBlock": {
      const content = richTextToPlainText(richTextFromTiptap(node.content))
      const language =
        typeof node.attrs?.language === "string"
          ? node.attrs.language
          : undefined
      return content.trim()
        ? { type: "code", content, language: language || undefined }
        : null
    }

    case "horizontalRule":
      return { type: "divider" }

    case "callout":
      return {
        type: "callout",
        variant:
          node.attrs?.variant === "success" ||
          node.attrs?.variant === "warning" ||
          node.attrs?.variant === "danger"
            ? node.attrs.variant
            : "info",
        content: richTextFromJsonAttr(node.attrs?.contentJson),
      }

    case "glossaryTerm": {
      const tags = parseJsonAttr<string[]>(node.attrs?.tagsJson, [])
      return {
        type: "glossary_term",
        term: String(node.attrs?.term ?? "Term"),
        title: String(node.attrs?.title ?? "Glossary title"),
        description: String(node.attrs?.description ?? ""),
        tags: tags.length > 0 ? tags : undefined,
      }
    }

    case "projectReference":
      return {
        type: "project_reference",
        project_id: String(node.attrs?.projectId ?? ""),
      }

    case "mention":
      return {
        type: "mention",
        label: String(node.attrs?.label ?? "Mention"),
        href:
          typeof node.attrs?.href === "string" && node.attrs.href.length > 0
            ? node.attrs.href
            : undefined,
        description:
          typeof node.attrs?.description === "string"
            ? node.attrs.description
            : undefined,
      }

    case "architectureDiagram":
      return {
        type: "architecture_diagram",
        nodes: parseJsonAttr(node.attrs?.nodesJson, []),
        edges: parseJsonAttr(node.attrs?.edgesJson, []),
      }

    case "expandableSection":
      return {
        type: "expandable",
        title: String(node.attrs?.title ?? "Section"),
        content: parseJsonAttr<ContentBlock[]>(node.attrs?.contentJson, []),
      }

    default:
      return null
  }
}

function richTextToTiptapInline(content: RichText): JSONContent[] {
  return spansToTiptapInline(normalizeRichText(content))
}

function blockToTiptapNode(block: ContentBlock): JSONContent | null {
  switch (block.type) {
    case "paragraph": {
      const inline = richTextToTiptapInline(block.content)
      return inline.length > 0 ? { type: "paragraph", content: inline } : null
    }

    case "heading": {
      const inline = richTextToTiptapInline(block.content)
      return inline.length > 0
        ? {
            type: "heading",
            attrs: { level: block.level },
            content: inline,
          }
        : null
    }

    case "bullet_list":
      return {
        type: "bulletList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: item ? [{ type: "text", text: item }] : [],
            },
          ],
        })),
      }

    case "numbered_list":
      return {
        type: "orderedList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: item ? [{ type: "text", text: item }] : [],
            },
          ],
        })),
      }

    case "quote": {
      const inline = richTextToTiptapInline(block.content)
      return inline.length > 0
        ? {
            type: "blockquote",
            content: [{ type: "paragraph", content: inline }],
          }
        : null
    }

    case "code":
      return block.content
        ? {
            type: "codeBlock",
            attrs: block.language ? { language: block.language } : {},
            content: [{ type: "text", text: block.content }],
          }
        : null

    case "divider":
      return { type: "horizontalRule" }

    case "link":
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: block.label,
            marks: inlineMarksToTiptap({
              text: block.label,
              marks: ["link"],
              href: block.href,
            }),
          },
        ],
      }

    case "callout":
      return {
        type: "callout",
        attrs: {
          variant: block.variant,
          contentJson: JSON.stringify(normalizeRichText(block.content)),
        },
      }

    case "glossary_term":
      return {
        type: "glossaryTerm",
        attrs: {
          term: block.term,
          title: block.title,
          description: block.description,
          tagsJson: JSON.stringify(block.tags ?? []),
        },
      }

    case "project_reference":
      return {
        type: "projectReference",
        attrs: { projectId: block.project_id },
      }

    case "mention":
      return {
        type: "mention",
        attrs: {
          label: block.label,
          href: block.href ?? "",
          description: block.description ?? "",
        },
      }

    case "architecture_diagram":
      return {
        type: "architectureDiagram",
        attrs: {
          nodesJson: JSON.stringify(block.nodes),
          edgesJson: JSON.stringify(block.edges),
        },
      }

    case "expandable":
      return {
        type: "expandableSection",
        attrs: {
          title: block.title,
          contentJson: JSON.stringify(block.content),
        },
      }

    default:
      return null
  }
}

export function toContentDocument(json: JSONContent): ContentDocument {
  const blocks: ContentBlock[] = []

  for (const node of json.content ?? []) {
    const block = tiptapNodeToBlock(node)
    if (block) {
      blocks.push(block)
    }
  }

  return { version: CONTENT_VERSION, blocks }
}

export function fromContentDocument(document: ContentDocument): JSONContent {
  const content = document.blocks
    .map(blockToTiptapNode)
    .filter((node): node is JSONContent => node !== null)

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  }
}

export function validateEditorContent(
  json: JSONContent
): EditorValidationResult {
  try {
    const document = toContentDocument(json)
    const parsed = contentDocumentSchema.safeParse(document)

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid editor content"
      return {
        success: false,
        error: message,
        data: { version: CONTENT_VERSION, blocks: [] },
      }
    }

    return {
      success: true,
      data: serializeContent(normalizeContentDocument(parsed.data)),
    }
  } catch {
    return {
      success: false,
      error: "Unable to serialize editor content",
      data: { version: CONTENT_VERSION, blocks: [] },
    }
  }
}

export function documentsEqual(
  a: ContentDocument,
  b: ContentDocument
): boolean {
  return (
    JSON.stringify(serializeContent(a)) === JSON.stringify(serializeContent(b))
  )
}

export function blockToPlainText(block: ContentBlock): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
    case "callout":
      return richTextToPlainText(block.content)
    case "code":
      return block.content
    case "bullet_list":
    case "numbered_list":
      return block.items.join(" ")
    case "link":
      return block.label
    case "glossary_term":
      return `${block.term} ${block.title} ${block.description}`
    case "mention":
      return block.label
    case "project_reference":
      return block.project_id
    case "architecture_diagram":
      return block.nodes.map((node) => node.label).join(" ")
    case "expandable":
      return `${block.title} ${block.content.map(blockToPlainText).join(" ")}`
    case "divider":
      return ""
    default:
      return ""
  }
}

export function computeContentStats(document: ContentDocument) {
  const text = document.blocks.map(blockToPlainText).join(" ").trim()
  const words = text.length > 0 ? text.split(/\s+/).filter(Boolean).length : 0
  const characters = text.length
  const readingTimeMinutes = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0

  return {
    words,
    characters,
    readingTimeMinutes,
  }
}

export const SLASH_COMMANDS = {
  "/heading": "heading",
  "/quote": "quote",
  "/code": "code",
  "/list": "list",
  "/divider": "divider",
  "/callout": "callout",
  "/glossary": "glossary",
  "/project": "project",
  "/expandable": "expandable",
  "/architecture": "architecture",
  "/mention": "mention",
} as const

export type SlashCommandKey = keyof typeof SLASH_COMMANDS

export function insertSlashBlock(
  editor: NonNullable<ReturnType<typeof import("@tiptap/react").useEditor>>,
  command: string,
  context?: { projectId?: string }
) {
  switch (command) {
    case "heading":
      editor.chain().focus().setHeading({ level: 2 }).run()
      break
    case "quote":
      editor.chain().focus().setBlockquote().run()
      break
    case "code":
      editor.chain().focus().setCodeBlock().run()
      break
    case "list":
      editor.chain().focus().toggleBulletList().run()
      break
    case "divider":
      editor.chain().focus().setHorizontalRule().run()
      break
    case "callout":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "callout",
          attrs: {
            variant: "info",
            contentJson: JSON.stringify([{ text: "Add your note here." }]),
          },
        })
        .run()
      break
    case "glossary":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "glossaryTerm",
          attrs: {
            term: "RAG",
            title: "Retrieval-Augmented Generation",
            description: "Combines retrieval with LLM reasoning.",
            tagsJson: JSON.stringify(["AI"]),
          },
        })
        .run()
      break
    case "project":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "projectReference",
          attrs: { projectId: context?.projectId ?? "" },
        })
        .run()
      break
    case "expandable":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "expandableSection",
          attrs: {
            title: "View Architecture",
            contentJson: JSON.stringify([
              {
                type: "paragraph",
                content: [{ text: "Nested content goes here." }],
              },
            ]),
          },
        })
        .run()
      break
    case "architecture": {
      const preset = ARCHITECTURE_PRESETS.rag
      editor
        .chain()
        .focus()
        .insertContent({
          type: "architectureDiagram",
          attrs: {
            nodesJson: JSON.stringify(preset.nodes),
            edgesJson: JSON.stringify(preset.edges),
          },
        })
        .run()
      break
    }
    case "mention":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "mention",
          attrs: {
            label: "CrewAI",
            href: "https://www.crewai.com",
            description: "Multi-agent orchestration framework.",
          },
        })
        .run()
      break
  }
}

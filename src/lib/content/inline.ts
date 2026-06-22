import { z } from "zod"

export const inlineMarkSchema = z.enum(["bold", "italic", "code", "link"])

export const inlineSpanSchema = z.object({
  text: z.string(),
  marks: z.array(inlineMarkSchema).optional(),
  href: z.string().url().optional(),
})

export const richTextSchema = z.union([
  z.string(),
  z.array(inlineSpanSchema).min(1),
])

export type InlineMark = z.infer<typeof inlineMarkSchema>
export type InlineSpan = z.infer<typeof inlineSpanSchema>
export type RichText = z.infer<typeof richTextSchema>

export function isInlineSpanArray(value: RichText): value is InlineSpan[] {
  return Array.isArray(value)
}

export function normalizeRichText(value: RichText): InlineSpan[] {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? [{ text: trimmed }] : []
  }

  return value.filter((span) => span.text.length > 0)
}

export function richTextToPlainText(value: RichText): string {
  return normalizeRichText(value)
    .map((span) => span.text)
    .join("")
}

export function plainTextToRichText(value: string): InlineSpan[] {
  const trimmed = value.trim()
  return trimmed ? [{ text: trimmed }] : []
}

export function mergeAdjacentSpans(spans: InlineSpan[]): InlineSpan[] {
  const merged: InlineSpan[] = []

  for (const span of spans) {
    const previous = merged.at(-1)
    const marksKey = JSON.stringify(span.marks ?? [])
    const prevMarksKey = previous ? JSON.stringify(previous.marks ?? []) : ""

    if (
      previous &&
      marksKey === prevMarksKey &&
      previous.href === span.href &&
      !span.marks?.includes("link")
    ) {
      previous.text += span.text
      continue
    }

    merged.push({ ...span })
  }

  return merged
}

export function tiptapMarksToInlineMarks(
  marks: Array<{ type: string; attrs?: Record<string, unknown> }> | undefined
): { marks?: InlineMark[]; href?: string } {
  if (!marks?.length) {
    return {}
  }

  const inlineMarks: InlineMark[] = []
  let href: string | undefined

  for (const mark of marks) {
    if (mark.type === "bold") {
      inlineMarks.push("bold")
    }
    if (mark.type === "italic") {
      inlineMarks.push("italic")
    }
    if (mark.type === "code") {
      inlineMarks.push("code")
    }
    if (mark.type === "link" && typeof mark.attrs?.href === "string") {
      inlineMarks.push("link")
      href = mark.attrs.href
    }
  }

  return inlineMarks.length > 0 ? { marks: inlineMarks, href } : {}
}

export function inlineMarksToTiptap(
  span: InlineSpan
): Array<{ type: string; attrs?: Record<string, unknown> }> {
  const marks: Array<{ type: string; attrs?: Record<string, unknown> }> = []

  for (const mark of span.marks ?? []) {
    if (mark === "bold") {
      marks.push({ type: "bold" })
    }
    if (mark === "italic") {
      marks.push({ type: "italic" })
    }
    if (mark === "code") {
      marks.push({ type: "code" })
    }
    if (mark === "link" && span.href) {
      marks.push({
        type: "link",
        attrs: { href: span.href, target: "_blank", rel: "noopener noreferrer" },
      })
    }
  }

  return marks
}

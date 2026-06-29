import { richTextToPlainText } from "@/features/content/lib/inline"
import {
  CONTENT_VERSION,
  type ContentDocument,
  createEmptyDocument,
} from "@/features/content/lib/schema"

export function achievementsToDocument(
  achievements: string[] | null | undefined
): ContentDocument {
  const items = (achievements ?? []).map((item) => item.trim()).filter(Boolean)

  if (items.length === 0) {
    return createEmptyDocument()
  }

  return {
    version: CONTENT_VERSION,
    blocks: [{ type: "bullet_list", items }],
  }
}

export function documentToAchievements(document: ContentDocument): string[] {
  const items: string[] = []

  for (const block of document.blocks) {
    if (block.type === "bullet_list" || block.type === "numbered_list") {
      items.push(...block.items.map((item) => item.trim()).filter(Boolean))
      continue
    }

    if (
      block.type === "paragraph" ||
      block.type === "heading" ||
      block.type === "quote" ||
      block.type === "callout"
    ) {
      const text = richTextToPlainText(block.content).trim()
      if (text) {
        items.push(text)
      }
    }
  }

  return items
}

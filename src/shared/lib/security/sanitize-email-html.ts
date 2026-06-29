import "server-only"

import { marked } from "marked"
import sanitizeHtml from "sanitize-html"

marked.setOptions({ gfm: true, breaks: true })

const EMAIL_MARKDOWN_ALLOWED_TAGS = [
  "h2",
  "h3",
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "code",
  "hr",
  "blockquote",
  "br",
] as const

function applyEmailMarkdownStyles(html: string): string {
  return html
    .replace(
      /<h2>/g,
      '<h2 style="font-size:16px;font-weight:700;margin:20px 0 8px;color:#1a1a1a;border-bottom:1px solid #e5e5e5;padding-bottom:6px;">'
    )
    .replace(
      /<h3>/g,
      '<h3 style="font-size:14px;font-weight:600;margin:16px 0 6px;color:#1a1a1a;">'
    )
    .replace(
      /<p>/g,
      '<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#333;">'
    )
    .replace(/<strong>/g, '<strong style="font-weight:700;color:#1a1a1a;">')
    .replace(
      /<table>/g,
      '<table style="border-collapse:collapse;width:100%;font-size:12px;margin:12px 0;">'
    )
    .replace(/<thead>/g, '<thead style="background:#f0f0f0;">')
    .replace(
      /<th>/g,
      '<th style="border:1px solid #ddd;padding:7px 10px;text-align:left;font-weight:600;white-space:nowrap;">'
    )
    .replace(
      /<td>/g,
      '<td style="border:1px solid #ddd;padding:6px 10px;vertical-align:top;line-height:1.5;">'
    )
    .replace(/<ul>/g, '<ul style="margin:6px 0 10px;padding-left:20px;">')
    .replace(/<ol>/g, '<ol style="margin:6px 0 10px;padding-left:20px;">')
    .replace(
      /<li>/g,
      '<li style="margin-bottom:4px;font-size:13px;line-height:1.5;color:#333;">'
    )
    .replace(
      /<code>/g,
      '<code style="background:#f4f4f4;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:11px;">'
    )
    .replace(
      /<hr>/g,
      '<hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;">'
    )
    .replace(
      /<blockquote>/g,
      '<blockquote style="border-left:3px solid #ddd;margin:10px 0;padding:4px 14px;color:#666;">'
    )
}

export function renderSanitizedEmailMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown) as string
  const sanitized = sanitizeHtml(rawHtml, {
    allowedTags: [...EMAIL_MARKDOWN_ALLOWED_TAGS],
    allowedAttributes: {
      ...Object.fromEntries(
        EMAIL_MARKDOWN_ALLOWED_TAGS.map((tag) => [tag, ["style"]])
      ),
    },
    allowedSchemes: [],
    disallowedTagsMode: "discard",
  })

  return applyEmailMarkdownStyles(sanitized)
}

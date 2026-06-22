# Formatting Preservation Audit (Phase 9.0)

## Test Matrix

| Formatting | Edit (Tiptap) | Save (ContentDocument) | Reload | Render (RichContentRenderer) | Pre-Phase 9 Status |
|------------|---------------|------------------------|--------|------------------------------|--------------------|
| **Bold** | Visible | **Lost** — flattened to plain string | Lost | Lost | **FAIL** |
| **Italic** | Visible | **Lost** | Lost | Lost | **FAIL** |
| **Inline code** | Visible | **Lost** | Lost | Lost | **FAIL** |
| **Inline links** | Visible | **Partial** — only when entire paragraph is one link (standalone `link` block) | Partial | Partial | **FAIL** for mixed inline |

## Root Cause

`editor-adapter.ts` used `extractPlainText()` which strips all Tiptap marks. Paragraph blocks stored `content: string` only.

## Resolution (Phase 9)

Extended `ContentDocument` to support inline spans:

```json
{
  "type": "paragraph",
  "content": [
    { "text": "RAG", "marks": ["bold"] },
    { "text": " combines retrieval with reasoning." }
  ]
}
```

### Changes

- `src/lib/content/inline.ts` — span types, normalization, Tiptap mark mapping
- `src/lib/content/schema.ts` — `paragraph`, `heading`, `quote`, `callout` accept `string | InlineSpan[]`
- `src/components/editor/editor-adapter.ts` — preserves marks on conversion
- `src/components/content/inline-text.tsx` — renders spans with `<strong>`, `<em>`, `<code>`, `<a>`
- Legacy string content continues to render unchanged

## Verification Flow

```
Edit in Tiptap → validateEditorContent() → ContentDocument with spans
→ server action → JSONB → reload → fromContentDocument() → Tiptap marks restored
→ RichContentRenderer → InlineText component
```

Backward compatibility: existing plain-string blocks deserialize and render without migration.

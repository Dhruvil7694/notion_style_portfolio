# Content System

Phase 7 introduces a structured content pipeline for rich text stored as JSONB in `projects.content` and `content.content`. This layer is editor-agnostic: Phase 8 replaces the minimal block editor with Tiptap without changing storage, validation, rendering, or server actions.

## Block Architecture

Content is stored as a versioned document:

```json
{
  "version": 1,
  "blocks": [
    { "type": "heading", "level": 2, "content": "System Design" },
    { "type": "paragraph", "content": "This project uses..." },
    { "type": "bullet_list", "items": ["Redis cache", "PostgreSQL"] },
    { "type": "quote", "content": "Simplicity is the ultimate sophistication." },
    { "type": "code", "content": "const x = 1;", "language": "typescript" },
    { "type": "divider" },
    { "type": "link", "href": "https://example.com", "label": "Documentation" }
  ]
}
```

### Supported Block Types

| Type | Fields | Editable in block editor |
|------|--------|--------------------------|
| `paragraph` | `content` | Yes |
| `heading` | `level` (1–3), `content` | Yes |
| `bullet_list` | `items[]` | Yes |
| `numbered_list` | `items[]` | Render only |
| `quote` | `content` | Yes |
| `code` | `content`, `language?` | Yes |
| `divider` | — | Render only |
| `link` | `href`, `label` | Render only |

The block editor supports a minimal subset. Additional block types can exist in stored JSON and render correctly.

## JSON Schema

Defined in `src/lib/content/schema.ts` using Zod:

- `contentBlockSchema` — discriminated union on `type`
- `contentDocumentSchema` — `{ version: 1, blocks: ContentBlock[] }`
- `contentDocumentSchema` is embedded in `projectFormSchema` and `contentFormSchema`

Validation runs on:

1. **Client** — React Hook Form + `zodResolver`
2. **Server** — server actions re-parse with the same schemas

Empty blocks (blank paragraphs, headings, etc.) are stripped by `serializeContent()` before persistence.

## Rendering Strategy

`RichContentRenderer` (`src/components/content/rich-content-renderer.tsx`) maps blocks to semantic HTML:

- Headings → `<h1>`–`<h3>`
- Paragraphs → `<p>`
- Lists → `<ul>` / `<ol>`
- Quotes → `<blockquote>`
- Code → `<pre><code>`
- Dividers → `<hr>`
- Links → `<a>` with `rel="noopener noreferrer"`

The renderer is presentation-only (no editor logic). It can be used in admin preview, future public pages, and server-rendered views.

## Serialization Flow

```
┌──────────────┐    deserializeContent()    ┌─────────────────┐
│  DB JSONB    │ ─────────────────────────▶ │ ContentDocument │
│  (raw Json)  │                            │  (form state)   │
└──────────────┘                            └────────┬────────┘
       ▲                                             │
       │              serializeContent()             │
       └─────────────────────────────────────────────┘
                          ▲
                          │ validateContent() / safeParseContent()
                          │
                   Server Action (create/update)
```

### Serializer Functions (`src/lib/content/serializer.ts`)

| Function | Purpose |
|----------|---------|
| `deserializeContent(raw)` | Load DB value into form state; never throws |
| `serializeContent(document)` | Clean + validate before save |
| `validateContent(raw)` | Strict parse; throws on invalid |
| `safeParseContent(raw)` | Returns `{ success, data, error? }` |

### Graceful Handling

The deserializer accepts:

- `null`, `undefined`, `{}` → empty document
- Raw block arrays → wrapped as `{ version: 1, blocks }`
- Legacy Tiptap `{ type: "doc", content: [...] }` → converted to paragraph/heading blocks

Malformed JSON returns an empty document via `safeParseContent`.

## Admin UI Components

| Component | Location | Role |
|-----------|----------|------|
| `ContentBlockEditor` | `components/admin/content-block-editor.tsx` | Add, remove, reorder, edit blocks |
| `BlockControls` | `components/admin/block-controls.tsx` | Move up/down, delete |
| `BlockPreview` | `components/admin/block-preview.tsx` | Live preview card below editor |
| `ContentField` | `components/admin/content-field.tsx` | Form field wrapper (editor + preview) |
| `RichContentRenderer` | `components/content/rich-content-renderer.tsx` | Shared rendering |

Preview updates immediately as blocks change (client-side state).

## Database Integration

- **Column:** `content jsonb NOT NULL DEFAULT '{}'` on both `projects` and `content` tables
- **Create/Update:** server actions call `serializeContent()` and persist the result
- **Read:** `getProjectById` / `getContentById` return full rows; forms call `deserializeContent(record.content)`
- **Delete:** unchanged; JSON removed with row

No migration required — existing `{}` and legacy Tiptap seed data deserialize safely.

## Future Tiptap Integration (Phase 8)

Phase 8 replaces `ContentBlockEditor` with a Tiptap editor. These layers stay unchanged:

| Layer | Change in Phase 8 |
|-------|-------------------|
| Database schema | None |
| `contentDocumentSchema` | None (Tiptap adapter converts to/from blocks) |
| `serializeContent` / `deserializeContent` | None |
| `RichContentRenderer` | None |
| Server actions | None |
| `ContentField` | Swap editor child from `ContentBlockEditor` → Tiptap |

Add a Tiptap adapter in `src/lib/content/tiptap-adapter.ts` (Phase 8) to convert ProseMirror JSON ↔ block array. The block format remains the canonical storage shape.

## File Reference

```
src/lib/content/
├── schema.ts       # Zod schemas + types + helpers
├── serializer.ts   # Parse / serialize / validate
└── index.ts

src/components/content/
└── rich-content-renderer.tsx

src/components/admin/
├── content-block-editor.tsx
├── block-controls.tsx
├── block-preview.tsx
└── content-field.tsx
```

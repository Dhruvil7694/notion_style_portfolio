# Rich Content Components

Phase 9 extends the Phase 7 `ContentDocument` format with interactive knowledge blocks while keeping JSONB storage, server actions, and the adapter pipeline unchanged.

## Formatting Preservation (Phase 9.0)

Inline formatting now survives the full edit → save → reload → render cycle via **inline spans**:

```json
{
  "type": "paragraph",
  "content": [
    { "text": "RAG", "marks": ["bold"] },
    { "text": " uses ", "marks": [] },
    { "text": "retrieval", "marks": ["italic"] }
  ]
}
```

Supported marks: `bold`, `italic`, `code`, `link` (with `href` on span).

Legacy plain-string content remains valid without migration.

See [formatting-preservation-audit.md](./formatting-preservation-audit.md).

## Component Architecture

```
src/lib/content/components/
├── registry.ts              # Zod-validated component registry
├── architecture-presets.ts # RAG, agentic, ETL, ML templates
└── index.ts

src/components/content/
├── inline-text.tsx          # Renders InlineSpan[]
├── hover-card.tsx           # 200ms hover / tap popover
├── block-renderer.tsx       # Block dispatch + fallbacks
├── rich-content-renderer.tsx
└── blocks/
    ├── callout-block.tsx
    ├── glossary-term-block.tsx
    ├── project-reference-block.tsx
    ├── mention-block.tsx
    ├── expandable-block.tsx
    └── architecture-diagram-block.tsx
```

## Registry System

```typescript
componentRegistry = {
  callout,
  project_reference,
  glossary_term,
  expandable_section,
  architecture_diagram,
  mention,
}
```

Each entry exposes:

- `type` — block discriminator
- `schema` — Zod validation
- `label` — human-readable name

`validateComponentBlock()` validates unknown component payloads.

## New Block Types

| Block | Purpose |
|-------|---------|
| `callout` | info / success / warning / danger documentation callouts |
| `glossary_term` | term + title + description + optional tags |
| `project_reference` | UUID reference → DB preview on hover |
| `mention` | @label with optional href + description |
| `expandable` | collapsible section with nested `ContentBlock[]` |
| `architecture_diagram` | SVG nodes + edges (preset templates) |

All blocks are JSON-serializable. No React components stored in the database.

## Hover Card Strategy

`HoverCard` component:

- **Desktop:** 200ms delay on hover
- **Mobile / keyboard:** tap or focus toggles pinned popover
- **Accessibility:** `aria-expanded`, `role="tooltip"`, keyboard focus support

Used by glossary terms, project references, and mentions.

Project references load preview data via `fetchProjectPreviewAction()` on first hover (read-only server action).

## Content Schema Extensions

Extended in `src/lib/content/schema.ts`:

- `inline.ts` — span types and Tiptap mark mapping
- Recursive `expandable` block via `z.lazy`
- `extractProjectIds()` for batch preview loading

Version remains `1` — backward compatible extension.

## Editor Integration

Tiptap custom nodes in `src/components/editor/extensions/content-nodes.ts`:

- Atom block nodes with React NodeViews for inline editing
- Toolbar + slash commands insert components
- Adapter converts custom nodes ↔ ContentDocument blocks

Pipeline unchanged:

```
Tiptap → editor-adapter → ContentDocument → server action → JSONB
```

## Rendering

`BlockRenderer` dispatches all block types with graceful fallback for unknown blocks.

`RichContentRenderer` accepts optional `projectPreviews` map for SSR-friendly project reference rendering.

## Future Extensibility

| Phase | Extension point |
|-------|-----------------|
| 10 Assets / Resume | Attach `asset_id` blocks; registry pattern |
| 11 Public portfolio | `BlockRenderer` + `projectPreviews` from public queries |
| 12 Search | Index `blockToPlainText()` + glossary/project metadata |
| 13 AI authoring | Tiptap extension hooks + adapter for AI-generated blocks |

Add new block types by:

1. Extend Zod schema in `schema.ts`
2. Register in `componentRegistry`
3. Add renderer in `blocks/`
4. Add Tiptap node + adapter mapping
5. Add toolbar/slash insertion

No database migration required.

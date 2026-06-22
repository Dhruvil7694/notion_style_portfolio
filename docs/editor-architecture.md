# Editor Architecture

Phase 8 replaces the minimal block editor with a Tiptap-powered authoring experience. The Phase 7 content pipeline remains the source of truth — the database stores `ContentDocument` JSON, not raw ProseMirror trees.

## Architecture Overview

```
┌─────────────────┐
│  TiptapEditor   │  User authoring (ProseMirror JSON in memory)
└────────┬────────┘
         │ onUpdate
         ▼
┌─────────────────┐
│  editor-adapter │  toContentDocument() / fromContentDocument()
└────────┬────────┘
         │ ContentDocument
         ▼
┌─────────────────┐     ┌──────────────────┐
│  React Hook Form│────▶│  Server Actions  │  (unchanged)
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  BlockPreview   │     │  JSONB column    │
│  RichContent    │     │  projects.content│
│  Renderer       │     │  content.content │
└─────────────────┘     └──────────────────┘
```

## Component Structure

```
src/components/editor/
├── tiptap-editor.tsx      # Main editor + autosave + slash commands
├── editor-toolbar.tsx     # Notion-style formatting bar
├── editor-status.tsx      # Saved / Saving / Unsaved indicators
├── editor-stats.tsx       # Word count, characters, reading time
├── editor-adapter.ts      # Tiptap JSON ↔ ContentDocument
└── index.ts
```

`ContentField` dynamically imports `TiptapEditor` with `ssr: false` to avoid SSR issues.

## Adapter Design

**File:** `src/components/editor/editor-adapter.ts`

| Function | Direction | Purpose |
|----------|-----------|---------|
| `fromContentDocument()` | Blocks → Tiptap JSON | Initialize editor from DB |
| `toContentDocument()` | Tiptap JSON → Blocks | Extract canonical storage format |
| `validateEditorContent()` | Tiptap JSON → validated `ContentDocument` | Safe conversion + Zod validation |
| `documentsEqual()` | Compare | Skip redundant autosaves |
| `computeContentStats()` | Stats | Live word/character/read time |

### Block Mapping

| ContentDocument block | Tiptap node |
|-----------------------|-------------|
| `paragraph` | `paragraph` |
| `heading` | `heading` (level 1–3) |
| `bullet_list` | `bulletList` + `listItem` |
| `numbered_list` | `orderedList` + `listItem` |
| `quote` | `blockquote` |
| `code` | `codeBlock` |
| `divider` | `horizontalRule` |
| `link` | `paragraph` with link mark |

Inline **bold** and **italic** are supported in the editor UI but flatten to plain text in `ContentDocument` paragraphs (renderer unchanged per Phase 8 constraints).

## Serialization Flow

1. Editor loads → `fromContentDocument(value)` → Tiptap doc
2. User edits → Tiptap `onUpdate` → `validateEditorContent(getJSON())`
3. Valid document → `onChange(document)` → React Hook Form state
4. Autosave (edit mode) → `updateProject` / `updateContent` with full form values
5. Manual save → same server actions via form submit
6. Server → `serializeContent()` → JSONB (unchanged from Phase 7)

## Autosave Flow

```
User types
    ↓
validateEditorContent()
    ↓
onChange() → form state + preview
    ↓
2 seconds idle (debounced)
    ↓
documentsEqual check → skip if unchanged
    ↓
Saving… indicator
    ↓
onAutosave(document) → existing update* server action
    ↓
Saved / error feedback
```

- **Enabled:** edit mode only (record must exist)
- **Create mode:** manual save via form submit; no autosave spam
- **Debounce:** 2000ms
- **Failure:** error shown; local form state preserved

## Toolbar & Commands

### Toolbar
H1, H2, H3, Bold, Italic, Bullet List, Numbered List, Quote, Code Block, Link, Divider

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| ⌘/Ctrl+B | Bold |
| ⌘/Ctrl+I | Italic |
| ⌘/Ctrl+Shift+7 | Numbered list |
| ⌘/Ctrl+Shift+8 | Bullet list |

(Provided by Tiptap StarterKit defaults.)

### Slash Commands
Type at start of a line, press Enter:

| Command | Inserts |
|---------|---------|
| `/heading` | Heading 2 |
| `/quote` | Blockquote |
| `/code` | Code block |
| `/list` | Bullet list |
| `/divider` | Horizontal rule |

## Error Recovery

| Scenario | Behavior |
|----------|----------|
| Invalid editor JSON | Error message; change blocked from propagating |
| Serialization failure | User feedback via `EditorStatus` |
| Autosave failure | "Unsaved changes" + error; content kept in editor |
| Page refresh after autosave | Content loaded from DB via `deserializeContent` |
| External value sync | Editor resets when form value changes (post-save refresh) |

## Future Extension Points

| Phase | Extension | Integration point |
|-------|-----------|-------------------|
| 9 | Resume uploads, assets | Unaffected — separate tables |
| 10 | Public portfolio pages | Import `RichContentRenderer` + stored `ContentDocument` |
| 11 | Search, SEO | Index `ContentDocument` plain text via `blockToPlainText()` |
| 12 | AI assistance | Hook into `TiptapEditor` extensions or adapter layer |

### Adding Tiptap Extensions
1. Register extension in `tiptap-editor.tsx`
2. Add toolbar control in `editor-toolbar.tsx`
3. Extend `tiptapNodeToBlock` / `blockToTiptapNode` in adapter if new block type
4. Extend Phase 7 schema + renderer only if new canonical block needed

Bold/italic persistence would require a Phase 10 renderer update or markdown encoding in paragraph strings.

## Dependencies

- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-link`
- `@tiptap/pm`

## Unchanged from Phase 7

- Database schema
- `ContentDocument` / block schema
- Server actions
- `RichContentRenderer`
- `serializeContent` / `deserializeContent`

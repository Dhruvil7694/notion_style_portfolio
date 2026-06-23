# Responsive Audit — Phase 17.98

## Critical Issues (must fix before launch)

### Navigation

- **Mobile nav uses `<details>` dropdown** — `src/components/public/site-header.tsx:86` implements `<details>` element for mobile nav menu trigger. Issues: no scroll lock on open, no keyboard trap, no Escape close (browser default doesn't work well), no `env(safe-area-inset-*)` awareness, positioned `absolute top-full right-0` may cause viewport overflow on 320px screens. Menu panel width `w-40` (~160px) acceptable but no max-width to handle landscape. Fix: Task 3.

- **Assistant inaccessible on mobile** — `AssistantPanel` renders inside `FloatingDock`, which has `className="dock-stack hidden md:flex"` in `src/components/public/public-layout.tsx:28` and `src/app/globals.css:374–386`. Hidden on mobile (display: none). Panel has responsive sizing (`w-[min(420px,calc(100vw-2rem))]` in panel component) but never renders. Fix: Task 3.

### Typography

- `--kb-font-name: 2.25rem` hardcoded in `.public-site` at `src/app/globals.css:194` — 36px name on 320px viewport: 36px × ~3 characters = 108px overflow if name is long. No mobile scale. Fix: Task 4.

- No responsive heading scale — `.kb-section-title` uses `var(--kb-font-section): 1.125rem` (fixed 18px); `.case-study-block-title` no scale. Fix: Task 4.

- Font sizing tokens exist (lines 194–197) but no responsive variants defined. All token values are fixed across all viewports.

### Layout

- `.public-site .dock-main` has `padding-left: calc(3.5rem + 2.75rem)` only at `≥768px` (`src/app/globals.css:1269–1272`). Mobile: no left padding → content full-width. ✓ Correct.

- `workspace-profile` padding: `1.5rem` left + `1.5rem` right (`src/app/globals.css:1277–1278`) → 3rem total. On 320px: 320 − 48 = 272px available. ✓ Acceptable (leaves ~16.5 chars for text at base font).

- `max-w-home: 720px` used in `SiteHeader` (`src/components/public/site-header.tsx:71`) and other pages. Combined with `px-6` (1.5rem × 2 = 3rem), on 320px leaves 272px content width. ✓ Safe.

- Mobile nav dropdown positioning: `absolute top-full right-0 z-50 mt-1 w-40` — on 320px, right-aligned 160px dropdown fits. ✓ Safe for standard devices; landscape 360px safe.

### Homepage (workspace identity)

- `workspace-name-row` layout: `grid-template-columns: minmax(0,1fr) auto` with clock icon beside name. On 320px: name + icon + clock should not wrap if name ≤ ~200px. ⚠️ Needs inspection of actual content (user's portfolio name length). Likely safe if name ≤ 20 chars. Fix: Task 5 (visual validation).

- `workspace-identity: max-width: 680px` — no horizontal overflow risk; constrained by container. ✓

### Project pages

- `ProjectListEntry` (`src/components/public/project-list-entry.tsx`) — simple link layout, no hardcoded widths, uses `className="project-entry"`. ✓ Needs CSS inspection for horizontal overflow risks.

- `ProjectCaseStudy` (`src/components/public/project-case-study.tsx`) — renders sections, blocks, lists, tables, diagrams, carousels. No widths visible in component. ✓ Needs CSS inspection. Fix: Task 6 (full audit).

- `CaseStudyBlock` structure: `<section className="case-study-block">` + `<h2 className="case-study-block-title">` + `<div className="case-study-block-body">`. No responsive overrides visible. Fix: Task 6.

### Expertise pages

- `ExpertiseAreaCard` (`src/components/public/expertise-area-card.tsx`) — link with title + description. No hardcoded widths. ✓ Needs CSS inspection.

### Search and Discovery

- `SearchPageClient` (`src/components/public/search-page-client.tsx`) — renders `DiscoverySearchResults` UI. Search input + results list. No responsive overrides visible in component.

- `DockSearch` (dynamic import in `floating-dock.tsx`, line 29) — `width: 19rem` (304px) absolute-positioned inside dock. When dock is `hidden md:flex`, search is hidden on mobile too. ✓ But `/search` page needs audit. Fix: Task 8.

### Knowledge graph

- No components read yet. Fix: Task 7.

### Architecture diagrams

- `JointFlowDiagram` (`src/components/public/joint-flow-diagram.tsx`) — JointJS graph rendering. Paper element responsive in theory, but JointJS does not support touch pan/zoom out-of-the-box. ✗ No touch event handlers visible. Fix: Task 10 (add touch pan/zoom).

### Tables

- `StackTable` (`src/components/public/stack-table.tsx`) — shadcn Table component with pagination, sorting. Uses `<Table>`, `<TableHead>`, `<TableBody>`, `<TableCell>`. Table element does not have `table-layout: fixed` or responsive overrides visible. On mobile, table may overflow unless parent constrains width. Fix: Task 11.

### CMS Admin

- `AdminLayout` (`src/components/admin/admin-layout.tsx:19`) — sidebar `hidden w-64 shrink-0 border-r md:sticky md:top-0 md:block md:h-screen`. Hidden on mobile. ✓ Correct pattern.

- `AdminHeader` + sidebar nav exist. Mobile nav existence unknown (not read yet). Fix: Task 12.

- Main content: `p-4 md:p-8` — mobile 16px padding, desktop 32px. ✓ Responsive.

### Tiptap Editor

- `EditorToolbar` (`src/components/editor/editor-toolbar.tsx`) — renders button children (Lucide icons, text labels). Buttons use `size="icon-xs"` + `variant="ghost"`. No flex-wrap or responsive groups visible. Toolbar may overflow on small screens. Fix: Task 13.

### Safe Areas

- **No `env(safe-area-inset-*)` anywhere in codebase** — checked `src/app/globals.css` (no occurrences). Fixed margins/paddings in place but no dynamic safe-area accounting. Notch devices (iPhone 14 Pro, fold devices) may have content under notch. Fix: Task 14.

## Viewport Targets

320px · 360px · 375px · 390px · 414px · 430px · 768px · 820px · 1024px · 1280px · 1440px · 1728px · 1920px · 2560px

## Summary by Audit Scope

| Category                          | Status        | Task    |
| --------------------------------- | ------------- | ------- |
| Mobile nav (`<details>`)          | 🔴 Critical   | Task 3  |
| Assistant mobile access           | 🔴 Critical   | Task 3  |
| Typography scale (name, headings) | 🟠 High       | Task 4  |
| Homepage layout grid              | 🟡 Medium     | Task 5  |
| Project pages overflow            | 🟡 Medium     | Task 6  |
| Knowledge graph pages             | ❓ Unknown    | Task 7  |
| Search/Explore page               | ❓ Unknown    | Task 8  |
| Diagrams (JointJS/ReactFlow)      | 🔴 No touch   | Task 10 |
| Tables horizontal scroll          | 🟡 Medium     | Task 11 |
| Admin mobile sidebar              | ✓ OK (hidden) | Task 12 |
| Editor toolbar wrapping           | 🟠 High       | Task 13 |
| Safe areas (notch)                | 🔴 Missing    | Task 14 |

## Files Audited

- `src/components/public/public-layout.tsx` — dock visibility
- `src/components/public/floating-dock.tsx` — assistant dock structure
- `src/components/public/site-header.tsx` — mobile nav dropdown
- `src/components/public/project-list-entry.tsx` — project list structure
- `src/components/public/project-case-study.tsx` — case study blocks
- `src/components/public/expertise-area-card.tsx` — expertise cards
- `src/components/public/search-page-client.tsx` — search UI
- `src/components/public/stack-table.tsx` — table structure
- `src/components/public/joint-flow-diagram.tsx` — diagram rendering
- `src/components/admin/admin-layout.tsx` — admin sidebar
- `src/components/editor/editor-toolbar.tsx` — editor toolbar
- `src/app/globals.css` — responsive utilities, dock styles, typography scale

## Next Steps

1. **Task 3**: Replace `<details>` with proper Sheet drawer (shadcn), move AssistantPanel to mobile-accessible location.
2. **Task 4**: Add responsive font scale via Tailwind plugins or CSS custom properties.
3. **Tasks 5–14**: Progressive hardening per audit findings.
4. **Task 15**: QA matrix validation on all viewport targets.

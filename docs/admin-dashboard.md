# Admin Dashboard

Phase 5 admin shell — layout, navigation, and read-only CMS views.

---

## Layout structure

```text
┌─────────────────────────────────────────────────────────┐
│ AdminLayout (protected)                                 │
│ ┌──────────────┐  ┌───────────────────────────────────┐ │
│ │ Sidebar      │  │ AdminHeader (mobile menu)         │ │
│ │ (desktop)    │  ├───────────────────────────────────┤ │
│ │              │  │ Page content (Server Components)  │ │
│ │ Nav items    │  │                                   │ │
│ │ User email   │  │                                   │ │
│ │ Logout       │  │                                   │ │
│ └──────────────┘  └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- **Desktop:** fixed 256px sidebar, scrollable main area
- **Mobile:** drawer navigation via `AdminMobileNav`

---

## Route hierarchy

### CMS resource pattern (Phase 6 ready)

Projects, content, and experience follow a **List → Create → Edit** flow:

```text
/admin/projects          List view
/admin/projects/new      Create view
/admin/projects/[id]     Edit view

/admin/content           List view
/admin/content/new       Create view
/admin/content/[id]      Edit view

/admin/experience        List view
/admin/experience/new    Create view
/admin/experience/[id]   Edit view
```

Route helpers: `src/config/admin-resource-routes.ts`

List pages link row titles to edit routes and expose a **New** action. Create/edit pages use `ResourceEditorShell` as Phase 6 placeholders — no forms yet.

### All admin routes

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard summary cards |
| `/admin/projects` | Projects list |
| `/admin/projects/new` | Create project (placeholder) |
| `/admin/projects/[id]` | Edit project (placeholder) |
| `/admin/content` | Content list |
| `/admin/content/new` | Create content (placeholder) |
| `/admin/content/[id]` | Edit content (placeholder) |
| `/admin/experience` | Experience list |
| `/admin/experience/new` | Create experience (placeholder) |
| `/admin/experience/[id]` | Edit experience (placeholder) |
| `/admin/skills` | Skills table |
| `/admin/education` | Education table |
| `/admin/resume` | Resume versions table |
| `/admin/settings` | Settings keys table |

Public admin routes (outside `(protected)`):

- `/admin/login`
- `/admin/logout`
- `/admin/unauthorized`

---

## Component hierarchy

```text
src/app/admin/(protected)/layout.tsx
└── AdminLayout
    ├── AdminSidebarNav (desktop)
    ├── AdminHeader
    │   └── AdminMobileNav (client drawer)
    └── {page}

src/components/admin/
├── admin-layout.tsx
├── admin-sidebar.tsx      → AdminSidebarNav
├── admin-header.tsx
├── admin-mobile-nav.tsx
├── page-header.tsx
├── stat-card.tsx
├── data-table.tsx         → DataTable / DataTablePlaceholder
├── empty-state.tsx
└── status-badge.tsx

src/config/admin-navigation.ts  → adminNavigation config
src/lib/admin/queries.ts        → read-only Supabase queries
```

Navigation is driven by `adminNavigation` — add items there to expand the sidebar.

---

## Data layer

All queries in `src/lib/admin/queries.ts` use `createClient()` from `@/lib/supabase/server`.

- **SELECT only** — no INSERT, UPDATE, DELETE
- RLS applies; admin JWT passes `is_admin()` for full reads
- Dashboard aggregates counts client-side from status/type columns

---

## Future CRUD integration points

| Area | Phase 6 work |
|------|----------------|
| `/admin/projects/new` | Create form + Server Action |
| `/admin/projects/[id]` | Edit form, Tiptap editor, publish |
| `/admin/content/new` | Type selector, create form |
| `/admin/content/[id]` | Tiptap editor, publish workflow |
| `/admin/experience/new` | Create form |
| `/admin/experience/[id]` | Edit form, reorder |
| `/admin/skills` | Add list/new/[id] pattern, then CRUD |
| `/admin/education` | Add list/new/[id] pattern, then CRUD |
| `/admin/resume` | File upload to Supabase Storage |
| `/admin/settings` | JSON editors for site_settings, social_links |

Replace `ResourceEditorShell` placeholders with real forms on create/edit routes — keep list pages read-only tables.

---

## Authentication

- `(protected)/layout.tsx` calls `requireAdmin()`
- Middleware refreshes session and redirects unauthenticated users
- Sidebar footer shows current admin email from session

---

## Related documents

- [Authentication](./authentication.md)
- [Admin Authorization](./admin-authorization.md)
- [Sitemap](./sitemap.md)

# CMS CRUD Architecture

Phase 6 transforms the admin dashboard from read-only lists into a full CMS with create, read, update, and delete operations for projects, content, experience, skills, and education.

## Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  List Page      │────▶│  New / Edit Page │────▶│  Entity Form (RHF)  │
│  (Server)       │     │  (Server)        │     │  (Client)           │
└────────┬────────┘     └────────┬─────────┘     └──────────┬──────────┘
         │                       │                          │
         │  queries.ts           │  getById                 │  Server Action
         ▼                       ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Supabase (PostgreSQL)                           │
│  Reads: createClient() (session, RLS)                                   │
│  Writes: createAdminClient() via getAdminMutationClient() + requireAdmin│
└─────────────────────────────────────────────────────────────────────────┘
```

## Route Structure

| Resource   | List                  | Create                     | Edit                          |
|------------|-----------------------|----------------------------|-------------------------------|
| Projects   | `/admin/projects`     | `/admin/projects/new`      | `/admin/projects/[id]`        |
| Content    | `/admin/content`      | `/admin/content/new`       | `/admin/content/[id]`         |
| Experience | `/admin/experience`   | `/admin/experience/new`    | `/admin/experience/[id]`      |
| Skills     | `/admin/skills`       | `/admin/skills/new`        | `/admin/skills/[id]`          |
| Education  | `/admin/education`    | `/admin/education/new`     | `/admin/education/[id]`       |

Resume CRUD is intentionally deferred to a later phase.

## Validation Strategy

Validation runs in two layers. **Never trust client validation alone.**

### Client (React Hook Form + Zod)

- Each entity has a Zod schema in `src/lib/admin/schemas/`.
- Forms use `zodResolver(schema)` for immediate field-level feedback.
- Input types (`z.input`) drive form state; output types (`z.output`) reflect transforms (e.g. comma-separated strings → arrays, empty strings → `null`).

### Server (Server Actions)

- Every mutation re-parses input with the same Zod schema via `safeParse`.
- On failure, returns `ActionResult` with `fieldErrors` from `zodFieldErrors()`.
- Client applies server field errors via `applyServerFieldErrors()`.

### Shared Schemas

| Schema file      | Purpose                                      |
|------------------|----------------------------------------------|
| `common.ts`      | Slug, status, URLs, list parsers, helpers    |
| `project.ts`     | Project form fields                          |
| `content.ts`     | Content form fields + type enum              |
| `experience.ts`  | Experience form + date range refine          |
| `skills.ts`      | Skill category + proficiency enums           |
| `education.ts`   | Education form fields                        |

## Mutation Flow

1. User submits form → client Zod validation (RHF).
2. Server action invoked with raw form values.
3. `getAdminMutationClient()` calls `requireAdmin()` then returns Supabase admin client.
4. Input re-validated with Zod on the server.
5. Database insert/update/delete executed.
6. `revalidatePath()` refreshes list and edit routes.
7. Create/delete redirect to edit page or list respectively.

### ActionResult Shape

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

### Status Workflow

Projects and content support `draft` and `published`:

- `StatusSelector` component in forms.
- `StatusBadge` on list pages.
- `resolvePublishedAt()` sets `published_at` on first publish; clears it when reverted to draft.

## Reusable Components

Located in `src/components/admin/forms/`:

| Component       | Role                                              |
|-----------------|---------------------------------------------------|
| `EntityForm`    | Form wrapper with global error display            |
| `FormField`     | Label, hint, error, and field slot                |
| `StatusSelector`| Draft / published toggle for publishable entities |
| `SaveBar`       | Submit + optional delete trigger                  |
| `DeleteDialog`  | Confirmation modal before delete                  |
| `ListToolbar`   | Search box + optional status filter (URL params)  |

Entity-specific forms live in `src/features/admin/forms/`.

## List Pages

- Server components fetch data via `src/lib/admin/queries.ts`.
- Search and status filters use URL search params (`q`, `status`).
- `ListToolbar` is wrapped in `<Suspense>` for `useSearchParams`.
- Queries use `.range(0, 49)` — pagination-ready (`ADMIN_PAGE_SIZE = 50`).
- Empty states handled by `DataTable`.

## Security

| Layer              | Mechanism                                           |
|--------------------|-----------------------------------------------------|
| Route protection   | `(protected)/layout.tsx` → `requireAdmin()`         |
| Middleware         | Session refresh; unauthenticated → `/admin/login`   |
| Mutations          | `requireAdmin()` inside every server action         |
| Database writes    | `createAdminClient()` (service role, bypasses RLS)  |
| Client             | No direct Supabase writes from the browser          |

Unauthorized users receive 403 from `requireAdmin()`. Missing records return `notFound()` on edit pages.

## Error Handling

| Scenario            | Behavior                                           |
|---------------------|----------------------------------------------------|
| Validation errors   | Field errors on form + optional global message     |
| Database failures   | `ActionResult.error` with Supabase message         |
| Permission failures | Thrown from `requireAdmin()` / layout redirect     |
| Missing records     | `notFound()` on edit routes                        |

## Future Editor Integration Points

Phase 7 will replace placeholder textareas with Tiptap. Integration points:

### Projects (`project-form.tsx`)

- Replace disabled `content_placeholder` textarea.
- Bind Tiptap output to `projects.content` JSON column.
- Extend `projectFormSchema` with a `content` field (JSON schema).
- Update `createProject` / `updateProject` to persist editor output.

### Content (`content-form.tsx`)

- Replace disabled body placeholder.
- Bind to `content.body` JSON column.
- Same schema + action updates as projects.

### Live Preview (Phase 7+)

- Edit pages can add a split-pane preview consuming the same JSON document.
- Public routes will read published records only.

### Not in Phase 6

- File uploads (cover images, assets)
- Resume storage CRUD
- Public portfolio pages
- Bulk actions

## File Reference

```
src/
├── app/admin/(protected)/
│   ├── projects/   content/   experience/   skills/   education/
│   │   ├── page.tsx          # list
│   │   ├── new/page.tsx      # create
│   │   └── [id]/page.tsx     # edit
├── components/admin/forms/   # reusable form primitives
├── features/admin/
│   ├── forms/                # entity-specific forms
│   └── hooks/use-form-submission.ts
├── lib/admin/
│   ├── actions/              # server actions (CRUD)
│   ├── queries.ts            # read queries + list filters
│   └── schemas/              # Zod validation
└── config/admin-resource-routes.ts
```

# Database Workflow

This document defines migration standards, deployment workflow, and type regeneration for the Supabase database.

---

## Migration Readiness (Quick Start)

Run these commands in order to apply Phase 3 schema to your Supabase project and regenerate TypeScript types.

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`npm install -g supabase` or use `npx supabase`)
- Supabase project created at [supabase.com](https://supabase.com)
- Project ref from your URL: `https://<project-ref>.supabase.co`
- `.env.local` configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Step-by-step

```bash
# 1. Authenticate with Supabase
supabase login

# 2. Link this repository to your remote project (once per machine)
supabase link --project-ref <your-project-ref>

# 3. Apply all pending migrations to the remote database
supabase db push

# 4. Regenerate TypeScript types from the live schema
#    Use --db-url if --linked fails with privileges error (see docs/database-workflow.md)
$dbUrl = "postgresql://postgres:YOUR_PASSWORD@db.qwbjfedzstyfhqlbsila.supabase.co:5432/postgres"
npx supabase gen types typescript --db-url $dbUrl --schema public | Out-File -FilePath src/types/database.ts -Encoding utf8

# 5. Verify the application still builds
npm run typecheck
npm run build
```

Replace `<your-project-ref>` with your project subdomain (e.g. `qwbjfedzstyfhqlbsila`).

### Optional: local development with Docker

```bash
# Requires Docker Desktop
supabase start
supabase db reset          # applies migrations + seed.sql
supabase gen types typescript --local > src/types/database.ts
```

### Optional: apply seed to remote staging

```bash
# Never run seeds in production
psql "$DATABASE_URL" -f supabase/seeds/seed.sql
```

### Verify migrations applied

```bash
supabase migration list
```

Expected migrations:

| Version | Name |
|---------|------|
| `20250619100000` | `initial_schema` |
| `20250619100001` | `indexes` |
| `20250619100002` | `rls_policies` |

---

## Directory Structure

```
supabase/
├── config.toml           # Supabase CLI configuration
├── migrations/           # Versioned SQL migrations (applied in order)
│   ├── 20250619100000_initial_schema.sql
│   ├── 20250619100001_indexes.sql
│   └── 20250619100002_rls_policies.sql
└── seeds/
    └── seed.sql          # Local development seed data
```

---

## Naming Convention

### Migration Files

```
YYYYMMDDHHMMSS_description.sql
```

| Part | Rule | Example |
|------|------|---------|
| Timestamp | UTC, sortable, unique per migration | `20250619100000` |
| Description | snake_case, verb or noun phrase | `initial_schema`, `add_newsletter_table` |

**Rules:**
- One logical change per migration when possible (schema vs indexes vs RLS is acceptable split)
- Never rename or edit a migration after it has been applied to production
- Forward-fix mistakes with a new migration file

### Database Objects

| Object | Convention | Example |
|--------|------------|---------|
| Tables | plural snake_case | `contact_submissions` |
| Enums | singular snake_case | `content_status` |
| Indexes | `idx_{table}_{columns}` | `idx_projects_slug` |
| Policies | `{table}_{role}_{action}` | `projects_public_read_published` |
| Functions | snake_case verbs | `is_admin`, `update_updated_at_column` |

---

## Local Development

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Docker running (for local Supabase stack)

### Commands

```bash
# Start local Supabase (Postgres, Auth, Storage, Studio)
supabase start

# Apply all migrations + seed
supabase db reset

# Apply pending migrations only (no seed)
supabase migration up

# Create a new migration file
supabase migration new add_feature_x

# Check migration status
supabase migration list
```

Local Studio: http://127.0.0.1:54323

---

## Remote Deployment

See [Migration Readiness (Quick Start)](#migration-readiness-quick-start) for the full command sequence.

### Link Project (once)

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

Project ref is the subdomain from `NEXT_PUBLIC_SUPABASE_URL` (e.g. `qwbjfedzstyfhqlbsila`).

### Push Migrations

```bash
# Apply migrations to linked remote project
supabase db push
```

### Regenerate Types

```bash
supabase gen types typescript --linked > src/types/database.ts
```

### Apply Seed (remote — staging only)

```bash
# Never run seeds in production
psql "$DATABASE_URL" -f supabase/seeds/seed.sql
```

---

## Rollback Strategy

Supabase migrations are **forward-only** by default. There is no automatic down migration.

### Safe Rollback Process

1. **Production issue detected** — Stop deploying dependent app code
2. **Write a revert migration** — New file that undoes the change (DROP COLUMN, DROP TABLE, etc.)
3. **Test revert locally** — `supabase db reset` then apply all migrations including revert
4. **Apply revert to production** — `supabase db push`
5. **Document** — Note the incident in the migration file comment

### When to Use `supabase db reset`

- Local development only
- Destroys all local data and reapplies migrations + seed
- Never use against production

### Emergency Production Fix

For critical data issues:
1. Take a Supabase backup/snapshot first (Dashboard → Database → Backups)
2. Apply targeted revert migration
3. Verify RLS policies still hold

---

## Type Generation

TypeScript types are generated from the live database schema and stored in `src/types/database.ts`.

### Regenerate Types

| Method | Docker required? | Your account |
|--------|------------------|--------------|
| `--db-url` | **Yes** | Works if Docker Desktop is running |
| `--linked` / `--project-id` | No | Fails with privileges error |
| Hand-maintained `database.ts` | No | Valid for Phase 4 (already in repo) |

**Recommended: `--db-url` with Docker Desktop**

```powershell
# Option A: interactive script (handles @ in password)
.\scripts\gen-types.ps1

# Option B: manual
$env:SUPABASE_DB_PASSWORD = "your@password"   # use env var, not hardcoded in URL
$encoded = [uri]::EscapeDataString($env:SUPABASE_DB_PASSWORD)
$dbUrl = "postgresql://postgres:${encoded}@db.qwbjfedzstyfhqlbsila.supabase.co:5432/postgres"
npx supabase gen types typescript --db-url $dbUrl --schema public | Out-File -FilePath src/types/database.ts -Encoding utf8
```

Start Docker Desktop first: https://docs.docker.com/desktop

> **Warning:** Never redirect output to `database.ts` until the command succeeds — a failed run writes an empty file.

### After Regeneration

1. Run `npm run typecheck` to verify no breaking changes
2. Commit `database.ts` alongside the migration that caused the change
3. Update application code if column types changed

### Typed Client Usage (Phase 4+)

```typescript
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabase = createClient<Database>(url, key)
```

---

## CI/CD Integration (Recommended)

```yaml
# Example GitHub Actions step
- name: Verify migrations
  run: supabase db push --dry-run
```

Before production deploy:
1. Apply migrations (`supabase db push`)
2. Regenerate types if schema changed
3. Deploy Next.js application

---

## Checklist: New Migration

- [ ] Migration file named with UTC timestamp
- [ ] RLS enabled on new tables
- [ ] Policies for public read / admin write documented
- [ ] Indexes added for query patterns
- [ ] Grants for `anon`, `authenticated`, `service_role`
- [ ] `docs/database-design.md` updated if schema changed significantly
- [ ] Types regenerated
- [ ] Tested locally with `supabase db reset`
- [ ] `npm run typecheck` passes

---

## Related Documents

- [Database Design](./database-design.md)
- [Admin Authorization Roadmap](./admin-authorization.md)
- [Folder Structure](./folder-structure.md)
- [Architecture](./architecture.md)

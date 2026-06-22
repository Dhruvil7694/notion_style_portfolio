# Pre-Phase 4 Setup

Run these steps **once** before starting Phase 4 (Admin authentication) and Phase 5 (Admin CMS).

Your Supabase project ref (from `.env.local`): **`qwbjfedzstyfhqlbsila`**

---

## Prerequisites checklist

- [ ] Supabase database password (Dashboard → Project Settings → Database → Database password)
- [ ] `ADMIN_EMAIL` set in `.env.local`
- [ ] Email provider enabled in Supabase Auth

---

## Step 1 — Push migrations

### Option A: Supabase CLI (recommended)

```powershell
npx supabase login
npx supabase link --project-ref qwbjfedzstyfhqlbsila
npx supabase db push
```

### Option B: Script with database password

```powershell
$env:SUPABASE_DB_PASSWORD = "your-database-password"
.\scripts\pre-phase4-setup.ps1 -PushMigrations
```

---

## Step 2 — Verify tables

```powershell
.\scripts\pre-phase4-setup.ps1 -VerifyTables
```

Expected tables: `projects`, `experience`, `content`, `skills`, `education`, `settings`, `resumes`, `contact_submissions`

---

## Step 3 — Create admin user

1. Supabase Dashboard → **Authentication** → **Providers** → **Email** → Enabled
2. **Authentication** → **Users** → **Create user**
3. Set email (must match `ADMIN_EMAIL` in `.env.local`) and password
4. Enable **Auto Confirm User** for local development

Add to `.env.local`:

```env
ADMIN_EMAIL=admin@example.com
```

Update `settings.admin_allowlist` seed email to match (see `supabase/seeds/seed.sql`).

---

## Step 4 — Confirm ready

```powershell
.\scripts\pre-phase4-setup.ps1 -VerifyAll
```

Sign in at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

See [authentication.md](./authentication.md) for the full auth flow.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `no privileges to access project` on link | Run `supabase login` with the account that owns the project |
| `project is paused` | Unpause in Supabase Dashboard |
| REST API 404 on tables | Migrations not applied — run `supabase db push` |
| Invalid login credentials | Confirm admin user exists and email matches `ADMIN_EMAIL` |
| 403 at `/admin/unauthorized` | Signed-in email does not match `ADMIN_EMAIL` |
| Redirect loop on `/admin/login` | Clear cookies; verify `ADMIN_EMAIL` matches Supabase user |

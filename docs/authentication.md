# Authentication

Single-admin email/password authentication via Supabase Auth.

---

## Architecture

```text
Email + Password
→ Supabase Auth (signInWithPassword)
→ Session cookies (SSR)
→ Middleware route protection
→ ADMIN_EMAIL authorization check
→ Admin routes
```

---

## Admin user setup

Create the administrator manually in Supabase:

1. Supabase Dashboard → **Authentication** → **Users** → **Create user**
2. Set email and password
3. Enable **Auto Confirm User** for local development
4. Set `ADMIN_EMAIL` in `.env.local` to the same email address

Ensure Email provider is enabled:

- Supabase Dashboard → **Authentication** → **Providers** → **Email** → Enabled

---

## Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/admin/login` | Public | Email/password sign-in |
| `/admin` | Admin only | Minimal admin shell (Phase 5 CMS) |
| `/admin/unauthorized` | Authenticated non-admin | 403 page |
| `/admin/logout` | Public | Clears session, redirects to login |

---

## Authorization helpers

Server-only utilities in `src/lib/auth/`:

| Function | Behavior |
|----------|----------|
| `getCurrentUser()` | Returns Supabase user or `null` |
| `isAuthenticated()` | `true` when a valid session exists |
| `isAdmin()` | `true` when session email matches `ADMIN_EMAIL` |
| `requireAuth()` | Redirects to `/admin/login` if unauthenticated |
| `requireAdmin()` | Redirects to `/admin/unauthorized` if not admin |

---

## Middleware

`src/middleware.ts` protects `/admin/*`:

- Unauthenticated → redirect `/admin/login`
- Authenticated non-admin → redirect `/admin/unauthorized`
- Refreshes Supabase session cookies on admin requests

Public admin paths: `/admin/login`, `/admin/unauthorized`, `/admin/logout`

---

## Database RLS

PostgreSQL `is_admin()` still reads `settings.admin_allowlist`. Keep the admin email in the allowlist seed (or update via SQL) so authenticated admin requests pass RLS when using the publishable key.

App-level admin checks use `ADMIN_EMAIL`. Both should reference the same address.

---

## Related documents

- [Admin Authorization](./admin-authorization.md)
- [Database Workflow](./database-workflow.md)

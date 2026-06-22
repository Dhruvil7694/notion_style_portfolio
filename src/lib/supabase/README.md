# Supabase Client Layer

This directory contains Supabase client factories only. No schema, queries, or business logic belong here.

## Clients

| Module | Export | Runtime | Key |
|--------|--------|---------|-----|
| `client.ts` | `createClient()` | Browser / Client Components | Publishable |
| `server.ts` | `createClient()` | Server Components, Actions, Route Handlers | Publishable + cookies |
| `admin.ts` | `createAdminClient()` | Server-only privileged code | Secret key |

## Usage Guidelines

- **Public reads:** Prefer `server.ts` in Server Components so RLS policies apply with session context.
- **Client interactivity:** Use `client.ts` only when browser-side Supabase access is required.
- **Admin CMS writes:** Use `admin.ts` from Server Actions after auth checks (Phase 4+).
- **Never** import `admin.ts` from Client Components or pass `SUPABASE_SECRET_KEY` to the client.

Environment variable for client-side access: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Phase 4 Additions

- Auth middleware for session refresh
- Typed database helpers generated from Supabase schema
- RLS policy tests

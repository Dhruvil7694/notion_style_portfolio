# Deployment Checklist

Use this checklist before promoting to production. Automated checks live at `/admin/launch` and `/admin/system`.

---

## Supabase

- [ ] RLS enabled on all public tables
- [ ] FORCE RLS enabled (`20250622000000_force_rls_all_tables` migration applied)
- [ ] RLS policies applied (`20250619100002_rls_policies` + subsequent migrations)
- [ ] All 20 migrations applied (`supabase migration list` matches repo)
- [ ] Admin user exists with email matching `ADMIN_EMAIL`
- [ ] Leaked password protection enabled (recommended — Supabase Dashboard → Auth)

---

## Vercel

- [ ] Project linked and production deployment healthy
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set (Production)
- [ ] `SUPABASE_SECRET_KEY` set (Production, server-only)
- [ ] `SITE_URL` set to production domain (e.g. `https://dhruvil.work`)
- [ ] `ADMIN_EMAIL` set (Production)
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set (Production)
- [ ] At least one AI provider key set (or CMS-stored encrypted keys configured)
- [ ] Custom domain configured and SSL active
- [ ] Do **not** run seed scripts in production

---

## CMS Settings

- [ ] **site_url** in `/admin/settings` matches Vercel `SITE_URL` (no SEO Configuration Mismatch)
- [ ] Site name, description, and owner profile populated
- [ ] Homepage avatar uploaded (optional — bundled fallback exists)
- [ ] Featured projects selected
- [ ] Resume PDF uploaded at `/admin/resume`
- [ ] Contact email and social links complete

---

## Monitoring

- [ ] `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` configured
- [ ] Sentry test from `/admin/debug/sentry` succeeds (admin only)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` configured
- [ ] PostHog receiving `$pageview` events on preview/production

---

## AI

- [ ] At least one provider configured (env or CMS AI settings)
- [ ] Public assistant responds on homepage (if feature flag enabled)
- [ ] Copilot accessible at `/admin/copilot` (admin only)
- [ ] Provider failover: secondary key configured (recommended)
- [ ] Rate limiting active — no "Production Rate Limiting Disabled" on `/admin/launch`
- [ ] AI usage logs visible at `/admin/debug/ai-costs`

---

## SEO

- [ ] Canonical URLs use production domain (view page source)
- [ ] `/sitemap.xml` includes `/about`, `/stack`, and published content
- [ ] `/robots.txt` allows public routes, disallows `/admin`
- [ ] `/llms.txt` reflects current `SITE_URL` and owner name
- [ ] OpenGraph images render (share preview on a project page)
- [ ] JSON-LD present on homepage and project pages (view source)

---

## Security

- [ ] `npm run security:audit` passes
- [ ] `/api/debug/sentry-test` returns 401 without auth, 403 for non-admin
- [ ] Copilot routes return 401/redirect without admin session
- [ ] No secrets in client bundle

---

## Performance (smoke)

- [ ] Homepage loads without console errors
- [ ] Assistant panel opens (desktop dock + mobile layer)
- [ ] Project case study pages render (mermaid, diagrams)
- [ ] `/stack` mobile list view works
- [ ] Run `docs/mobile-audit.md` checklist on key pages

---

## Final validation

```bash
npm run typecheck
npm run lint
npm run build
npm run security:audit
```

All must pass with zero ESLint warnings.

Visit `/admin/launch` — target **≥95%** readiness score with no critical issues.

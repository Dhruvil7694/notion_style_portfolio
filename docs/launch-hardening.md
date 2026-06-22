# Launch Hardening — Phase 17.9

Production readiness layer: monitoring, analytics, caching, AI cost visibility, content health, launch readiness, deployment verification.

---

## 1. Monitoring (Sentry)

**Files:**
- `src/lib/monitoring/sentry.ts` — lazy init, no-op without DSN
- `src/lib/monitoring/logger.ts` — structured logger with Sentry integration
- `src/lib/monitoring/error-context.ts` — error enrichment helpers
- `sentry.client.config.ts` — browser Sentry init
- `sentry.server.config.ts` — server Sentry init

**Env vars required:**
- `SENTRY_DSN` — server-side error capture
- `NEXT_PUBLIC_SENTRY_DSN` — client-side error capture

**What is captured:**
- React errors (via ErrorBoundary + Sentry)
- AI provider failures and timeouts
- Copilot tool failures
- Discovery and knowledge graph failures
- Route errors

**Sentry is optional** — system works without DSN (falls back to console.error).

---

## 2. Knowledge Summary Cache

**File:** `src/lib/ai/cache/summaries.ts`

All summaries cached with `unstable_cache`:

| Cache key | TTL | Tags |
|-----------|-----|------|
| portfolio-snapshot | 10 min | ai-cache-portfolio-snapshot |
| knowledge-summary | 10 min | ai-cache-knowledge-summary |
| tool-summary | 10 min | ai-cache-tool-summary |
| expertise-summary | 10 min | ai-cache-expertise-summary |
| technology-summary | 10 min | ai-cache-technology-summary |
| suggested-questions | 60 min | (siteUrl key) |

**Invalidation:** Tags align with content update mutations. When a project/expertise/technology is updated, call `revalidateTag("ai-cache-*")` in the server action.

---

## 3. Discovery Cache Audit

**Status: Already cached ✓**

| Function | Cache | TTL | Tags |
|----------|-------|-----|------|
| `buildKnowledgeGraph()` | `unstable_cache` | 3600s | public-knowledge-graph |
| `buildDiscoveryIndex()` | `unstable_cache` | 3600s | public-discovery, public-knowledge-graph |
| `buildDiscoveryIndexFromGraph()` | pure function (no I/O) | — | — |
| `resolveEntityNavigation()` | called with cached graph | — | — |
| `buildTopicClusters()` | called with cached graph | — | — |

**Result:** Discovery computation never runs on every request. All graph-dependent functions derive from the cached `buildKnowledgeGraph` call.

---

## 4. AI Usage Dashboard

**Route:** `/admin/ai`

**File:** `src/lib/admin/ai-usage-queries.ts`

Exposes `ai_usage_logs` table as metrics:

- Total requests, success rate, estimated cost, avg latency
- Token usage breakdown (input/output)
- By provider breakdown
- By model breakdown
- Recent errors with provider/model context
- Failover count (failed requests that triggered retry)

---

## 5. Content Health Engine

**Files:**
- `src/lib/content-health/rules.ts` — scoring rule definitions
- `src/lib/content-health/scoring.ts` — per-item scorer
- `src/lib/content-health/engine.ts` — full audit runner

**Route:** `/admin/content-health`

**Scoring rubric (projects, max 100):**

| Check | Points |
|-------|--------|
| Title + Slug | 10 |
| Summary | 10 |
| Overview + Problem statement | 16 |
| Tech stack | 5 |
| Cover image + Screenshots | 16 |
| AI summary | 6 |
| FAQ | 5 |
| OG title + description | 10 |
| Results/metrics + Learnings | 13 |
| Expertise links | 5 |

Score bands:
- ≥ 80: Healthy
- 50–79: Warning
- < 50: Critical

---

## 6. Launch Readiness Dashboard

**Route:** `/admin/launch`

**File:** `src/lib/deployment/checks.ts`

Sections and checks:

| Section | Checks |
|---------|--------|
| Security | SUPABASE_SECRET_KEY, ADMIN_EMAIL, SITE_URL not localhost |
| AI | At least one provider key configured |
| Database | Supabase connectivity ping |
| Infrastructure | UPSTASH_REDIS, rate limiting |
| Monitoring | SENTRY_DSN configured |
| Analytics | POSTHOG_KEY configured |
| SEO | SITE_URL is production URL |

Status: Healthy / Warning / Critical
Launch score = (healthy checks / total checks) × 100

---

## 7. Analytics (PostHog)

**Files:**
- `src/lib/analytics/posthog-client.ts` — browser-side PostHog wrapper
- `src/lib/analytics/posthog-server.ts` — server-side posthog-node wrapper
- `src/components/public/analytics-provider.tsx` — React provider with pageview tracking

**Env vars:**
- `NEXT_PUBLIC_POSTHOG_KEY` — browser key (phc_...)
- `NEXT_PUBLIC_POSTHOG_HOST` — default: https://app.posthog.com
- `POSTHOG_API_KEY` — server-side key

**Events tracked:**
All events defined in `src/lib/analytics/events.ts` — page views, project views, search queries, assistant questions, resume downloads, contact clicks.

**Analytics is optional** — no-op when keys not configured.

---

## 8. Deployment Verification (/admin/system)

**Route:** `/admin/system`

Live checks on every page load (`force-dynamic`):

| Category | Checks |
|----------|--------|
| Security | 3 required env vars |
| Database | Supabase connectivity |
| AI | Which providers configured |
| Infrastructure | Redis, rate limiting |
| Monitoring | Sentry |
| Analytics | PostHog |

Output: Pass / Warn / Fail per check, aggregate score.

---

## 9. Recovery Procedures

### Sentry not receiving errors
1. Verify `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in Vercel env
2. Check `sentry.server.config.ts` and `sentry.client.config.ts` exist at project root
3. Redeploy — Sentry init files are read at build time

### Knowledge summaries not invalidating
1. Ensure server actions call `revalidateTag("ai-cache-portfolio-snapshot")` etc. after mutations
2. Manual revalidation: `revalidateTag("public-knowledge-graph")` in `/admin/api/revalidate`

### Discovery showing stale data
1. Cache TTL is 3600s — max 1h stale
2. Force revalidation via `revalidateTag("public-discovery")` in a server action

### PostHog events not appearing
1. Check `NEXT_PUBLIC_POSTHOG_KEY` starts with `phc_`
2. Verify `AnalyticsProvider` is mounted in the root layout
3. PostHog batches events — may take 1-2 minutes to appear in dashboard

### AI usage costs unexpectedly high
1. Check `/admin/ai` for provider breakdown
2. Copilot `maxOutputTokens` is capped at `settings.max_tokens` from `/admin/ai-settings`
3. Consider reducing `stepCountIs(10)` limit in `src/lib/copilot/agent.ts`

---

## Launch Checklist

Before deploying to production:

- [ ] All required env vars set in Vercel
- [ ] Supabase migrations applied (`supabase db push`)
- [ ] At least one AI provider key configured
- [ ] SITE_URL set to production domain (not localhost)
- [ ] `/admin/system` shows all critical checks passing
- [ ] `/admin/launch` score ≥ 80%
- [ ] `/admin/content-health` — no critical items (or acknowledged)
- [ ] Sentry DSN configured (optional but recommended)
- [ ] PostHog key configured (optional but recommended)
- [ ] Keep-alive workflow active (`.github/workflows/keep-alive.yml`)
- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes

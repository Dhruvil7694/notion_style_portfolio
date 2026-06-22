# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into this Next.js 15 App Router project.

**What was already in place (no changes needed):**

- `src/instrumentation-client.ts` — PostHog init via `posthog-js` (Next.js 15.3+ pattern), Sentry co-init
- `next.config.ts` — reverse proxy rewrites for `/ingest/*` → `us.i.posthog.com`
- `src/lib/analytics/posthog-client.ts` — `captureEvent` client wrapper
- `src/lib/analytics/posthog-server.ts` — `posthog-node` server wrapper
- `src/components/public/view-tracker.tsx` — generic ViewTracker component
- `src/lib/analytics/events.ts` — typed event registry with 22 named events
- Events already firing: `project_view`, `expertise_view`, `technology_view`, `search_opened`, `search_query`, `search_result_click`, `assistant_opened`, `assistant_question`, `assistant_source_click`, `resume_download`

**New instrumentation added this run:**

| Event                  | Description                                           | File                                                                           |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `research_view`        | Fires when a visitor loads a research detail page     | `src/app/(public)/research/[slug]/page.tsx`                                    |
| `automation_view`      | Fires when a visitor loads an automation detail page  | `src/app/(public)/automations/[slug]/page.tsx`                                 |
| `faq_expand`           | Fires when a visitor expands a FAQ accordion item     | `src/components/public/faq-section.tsx`                                        |
| `contact_click`        | Fires when a visitor clicks an email or calendly link | `src/app/(public)/contact/page.tsx` + `src/components/public/contact-link.tsx` |
| `copilot_opened`       | Fires when the admin opens the copilot panel          | `src/app/admin/(protected)/copilot/copilot-client.tsx`                         |
| `copilot_tool_invoked` | Fires when the admin confirms a copilot tool action   | `src/app/admin/(protected)/copilot/copilot-client.tsx`                         |

**Files created:** `src/components/public/contact-link.tsx`

**Bug fixed:** `copilot-client.tsx` was calling `createAnalyticsEvent()` (creates a typed object — does not send to PostHog) instead of `captureEvent()`. Fixed.

## Next steps

Dashboard created via PostHog MCP on project 439834 (US cloud):

**[Portfolio Analytics (wizard)](https://us.posthog.com/project/439834/dashboard/1745788)**

| #   | Insight                   | Type   | Configuration                                                                 |
| --- | ------------------------- | ------ | ----------------------------------------------------------------------------- |
| 1   | Pageviews by content type | Trend  | `project_view`, `research_view`, `automation_view`, `article_view` — last 30d |
| 2   | FAQ engagement            | Trend  | `faq_expand` breakdown by `question` — last 30d                               |
| 3   | Contact conversion funnel | Funnel | `project_view` → `contact_click`, 14-day window                               |
| 4   | Search usage              | Trend  | `search_query` avg of `resultCount` — last 30d                                |
| 5   | Assistant adoption        | Trend  | `assistant_opened` + `assistant_question` — last 30d                          |

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and Vercel environment variables so all environments have PostHog configured.
- [ ] Wire source-map upload (`posthog-cli sourcemap`) into CI so production stack traces de-minify in PostHog error tracking.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

# AI Infrastructure (Phase 17.5)

Provider-agnostic AI layer with CMS-configurable routing, citations, context budgeting, and usage tracking.

## Provider Architecture

All providers implement a common adapter interface in `src/lib/ai/providers/`:

- `generate()` / streaming via AI SDK `LanguageModel`
- `healthCheck()` — latency + availability probe
- `modelList()` — registered models with capabilities

Supported providers:

| Provider | Env Key | Protocol |
|----------|---------|----------|
| OpenAI | `OPENAI_API_KEY` | Native |
| Anthropic | `ANTHROPIC_API_KEY` | Native |
| Google Gemini | `GOOGLE_GENERATIVE_AI_API_KEY` | Native |
| Groq | `GROQ_API_KEY` | OpenAI-compatible |
| OpenRouter | `OPENROUTER_API_KEY` | OpenAI-compatible |
| NVIDIA NIM | `NVIDIA_API_KEY` | OpenAI-compatible |

API keys live in environment variables only. Model selection lives in CMS (`/admin/ai-settings`).

## Routing Strategy

`resolveModelChain(role)` builds an ordered provider chain:

1. Primary provider/model from CMS settings (public or copilot role)
2. Fallback provider/model from CMS settings
3. Automatic failover order: OpenAI → Anthropic → Gemini → OpenRouter → Groq → NVIDIA

Public assistant prefers fast/cheap models. Copilot prefers strong reasoning models.

## Failover Strategy

On provider failure:

- Log failure (best-effort to `ai_usage_logs`)
- Try next configured provider in chain
- Return generic error if all providers fail — never expose stack traces

## Citation System

Every public assistant response includes a `CitationBundle`:

- Sources (primary retrieval hits)
- Related projects, technologies, expertise, concepts
- Confidence score (high / medium / low)

Citations are sent as stream data parts (`data-citations`) — not HTTP headers — to support Unicode content safely.

## Context Budget Manager

`src/lib/ai/context-budget/` allocates the ~12K character context window:

| Category | Default % |
|----------|-----------|
| Projects | 40% |
| Research | 25% |
| Concepts | 20% |
| Technologies | 10% |
| Expertise | 5% |

Configurable from CMS AI settings.

## Prompt Caching

Cached summaries (10-minute TTL via `unstable_cache`):

- Portfolio snapshot (with health score)
- Knowledge graph summary
- Copilot tool catalog
- Expertise summary
- Technology summary

Copilot receives summaries before raw content, reducing prompt size.

## Audit Engine

Extended dimensions in `src/lib/copilot/audit/dimensions.ts`:

- **SEO** — metadata, description, cover image
- **AEO** — AI summary, FAQ, takeaways
- **GEO** — knowledge graph links, concept density
- **Discovery** — search visibility, keywords
- **Case Study** — problem, architecture, tradeoffs, visuals

## Approval Workflow

Content mutations follow: Generate → Preview → Approve → Apply

Apply tools (`applyFaq`, `applySummary`, etc.) require `confirmed: true`. Actions logged to `copilot_actions`.

## Usage Tracking

`ai_usage_logs` records provider, model, tokens, cost estimate, latency per request. No dashboard yet — foundation for Phase 18 analytics.

## Future Embeddings Integration

The retrieval pipeline accepts a pluggable embedding step. `DiscoveryDocument.embedding` is reserved. Context budget and citation layers remain unchanged when embeddings are added.

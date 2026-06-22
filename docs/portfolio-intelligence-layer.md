# Portfolio Intelligence Layer

Phase 17 introduces two separate AI systems: a public retrieval assistant and an admin CMS Copilot.

## Public Portfolio Assistant

**Purpose:** Answer visitor questions about Dhruvil's portfolio using published content only.

**Architecture:**

```
User Question
    ↓
Discovery Index Search (keyword ranking)
    ↓
Knowledge Graph Expansion (related entities)
    ↓
Context Window Builder
    ↓
LLM (OpenAI via Vercel AI SDK)
    ↓
Streaming Answer + Source References
```

**Characteristics:**
- Read-only — no database mutations
- No memory between sessions
- No agents or LangGraph
- Published content only (via existing public queries / discovery index)

**API:** `POST /api/chat` — streaming UI message response  
**UI:** Floating widget in public layout (`src/components/public/chat/`)

**Model:** `OPENAI_PUBLIC_MODEL` (default: `gpt-4o-mini`)

---

## CMS Copilot

**Purpose:** Portfolio architect for the admin — audit quality, suggest relationships, generate content previews.

**Architecture:**

```
Admin Message
    ↓
LangGraph Workflow
    ├── Intent Detection
    ├── Context Builder
    ├── Tool Selection
    ├── Execution
    ├── Validation
    └── Response
    ↓
Streaming Response + Session Persistence
```

**Characteristics:**
- Admin-only (`requireAdmin()` on all routes)
- Agentic via LangGraph (single workflow, no multi-agent swarm)
- Tool-based writes with confirmation required
- Session history in Supabase (`chat_sessions`, `chat_messages`)

**Routes:**
- `POST /api/copilot/chat` — run workflow, stream response
- `GET|POST /api/copilot/tools` — list / execute tools
- `GET|POST|DELETE /api/copilot/sessions` — session management

**UI:** `/admin/copilot`

**Model:** `OPENAI_COPILOT_MODEL` (default: `gpt-4o`)

---

## Shared AI Infrastructure

Located in `src/lib/ai/`:

| Module | Purpose |
|--------|---------|
| `types.ts` | Shared AI types |
| `prompts.ts` | System prompts |
| `models.ts` | OpenAI model configuration |
| `retrieval.ts` | Discovery + KG retrieval pipeline |
| `context-builder.ts` | Context window assembly |
| `stream.ts` | Public assistant streaming |

---

## Retrieval Strategy

1. **Search Discovery Index** — `searchDocuments()` with existing ranking weights
2. **Get top entities** — top N results by score
3. **Expand related entities** — inbound/outbound KG relationships
4. **Build context window** — formatted text, max ~12K chars
5. **Generate answer** — LLM with strict context-only prompt

No embeddings in Phase 17. Keyword + graph retrieval only.

---

## Tool System

Tools live in `src/lib/copilot/tools/`. All mutations go through validated executors.

| Tool | Confirmation Required |
|------|----------------------|
| `auditPortfolio`, `auditProject` | No |
| `searchKnowledgeGraph`, `suggestRelationships` | No |
| `generateAiSummary`, `generateFaq`, etc. | No (preview only) |
| `createProject`, `updateProject`, `createSkill`, etc. | Yes |

Generated content returns previews — never auto-saved.

---

## Audit Engine

Located in `src/lib/copilot/audit/`:

- **Project Health Score** — weighted checklist (overview, problem, architecture, FAQ, etc.)
- **Portfolio Health Score** — average across all projects + portfolio-level issues
- **Relationship Suggestions** — missing tech/expertise/concept links from KG analysis

Example output:
```
BohrAI — Health Score: 86%
Missing: FAQ, Tradeoffs, Additional Concepts
```

---

## LangGraph Workflow

Single linear workflow in `src/lib/copilot/graph/`:

```
START → detectIntent → buildContext → selectTools → executeTools → validate → respond → END
```

No planner agents, researcher agents, or agent swarms.

---

## Analytics Events

Defined in `src/lib/analytics/events.ts` (stub transport — no provider yet):

- `assistant_opened`, `assistant_question`, `assistant_source_click`
- `copilot_opened`, `copilot_tool_invoked`, `copilot_audit_run`, `copilot_content_generated`

---

## Environment Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_PUBLIC_MODEL=gpt-4o-mini
OPENAI_COPILOT_MODEL=gpt-4o
NEXT_PUBLIC_FEATURE_PORTFOLIO_ASSISTANT=true
```

---

## Future: Embeddings & Semantic Retrieval

Phase 17 reserves `DiscoveryDocument.embedding` and `semanticScore` fields. Next steps:

1. Generate embeddings for discovery documents
2. Hybrid ranking (keyword + cosine similarity)
3. Optional vector store (pgvector or external)
4. Semantic chunk retrieval for long case studies

The retrieval pipeline in `src/lib/ai/retrieval.ts` is designed to accept an embedding step without changing the public API contract.

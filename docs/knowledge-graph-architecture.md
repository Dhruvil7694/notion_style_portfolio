# Knowledge Graph Architecture

Phase 15 transforms the portfolio from isolated pages into a connected, machine-readable knowledge graph optimized for AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization).

## Knowledge Graph Model

The graph is computed at runtime from published CMS content — no separate graph database table.

```
Entity types:
  project | research | writing | automation | expertise | technology | concept

Relationship types:
  uses_expertise | uses_technology | relates_to_concept
```

Core modules live in `src/lib/knowledge/`:

| Module | Purpose |
|--------|---------|
| `types.ts` | Entity, relation, and payload types |
| `taxonomy.ts` | Default expertise slugs, technology aliases, normalization |
| `schemas.ts` | FAQ, project facts, tradeoffs validation |
| `entity-extractor.ts` | Pattern-based technology/concept extraction from text |
| `entities.ts` | CMS rows → graph entities |
| `relations.ts` | Relation builders and scoring |
| `graph.ts` | `buildKnowledgeGraph()`, bundles, related content |
| `index.ts` | Public exports |

## Entity Relationships

```
Expertise Area ← uses_expertise ← Project / Content
Technology     ← uses_technology ← Project
Concept        ← relates_to_concept ← Project / Content
```

Related content is scored by shared expertise slugs, concepts, tags, and direct graph edges. `findRelatedKnowledge()` returns grouped bundles for UI rendering.

## Expertise Taxonomy

CMS-managed via `expertise_areas` table and `/admin/expertise`.

Seeded domains:

- ai-engineering
- rag-systems
- multi-agent-systems
- document-intelligence
- enterprise-automation
- mlops
- evaluation-systems
- vector-search
- knowledge-systems
- ai-infrastructure

Public routes: `/expertise`, `/expertise/[slug]`

Projects and content link via `expertise_slugs[]`.

### Expertise Relationships

`expertise_areas.related_expertise_slugs[]` creates **Expertise → Expertise** edges (`related_expertise` relation).

Example: RAG Systems → Vector Search, Document Intelligence, Multi-Agent Systems, Evaluation Systems

## Technology Taxonomy

Technologies combine registry hubs and inferred slugs:

1. **CMS registry** (`technology_registry`) — description, category, website, documentation
2. Explicit `technologies[]` on projects
3. `tech_stack[]` on projects
4. Entity extraction from text

Public routes: `/technology`, `/technology/[slug]`  
Admin: `/admin/technologies`

## Concept Taxonomy

Public routes: `/concept`, `/concept/[slug]`

Sources: explicit `concepts[]`, entity extraction, CMS `concept_registry` authority pages.

Seeded: hybrid-retrieval, citation-validation, agent-memory  
Admin: `/admin/concepts`

## Related Content Scoring

Weighted overlap in `findRelatedKnowledge()` (`src/lib/knowledge/scoring.ts`):

| Signal | Weight |
|--------|--------|
| Concept overlap | ×5 |
| Technology overlap | ×3 |
| Expertise overlap | ×2 |
| Tag overlap | ×1 |
| Direct graph edge | +4 |

## AEO Strategy

Answer engines and LLMs retrieve structured, citable content:

- **AI Summary** (`ai_summary`) — 2–5 sentence machine-readable explanation on projects and content
- **Key Takeaways** (`key_takeaways[]`) — bullet points LLMs frequently cite
- **FAQ** (`faq` jsonb) — question/answer pairs with automatic **FAQPage JSON-LD**
- **Project Facts** (`project_facts` jsonb) — structured metrics (role, latency, scale, etc.)
- **Tradeoffs** — decision/alternative/reason tables documenting engineering choices
- **DefinedTerm JSON-LD** on expertise authority pages
- **TechArticle JSON-LD** on research pages

## GEO Strategy

Generative engines discover expertise through:

- Authority pages aggregating all related work by domain
- Technology pages aggregating usage across content types
- Semantic internal linking via `KnowledgeRelatedSection`
- Expertise badges on project pages linking to authority pages
- `public/llms.txt` describing the graph structure and key routes
- `/api/knowledge-graph` JSON export for future AI integrations

## FAQ System

Reusable `FaqSection` component (client-side expand/collapse). CMS-managed via `FaqField` in project and content forms.

Schema: `[{ question, answer }]`

FAQPage JSON-LD is merged into page JSON-LD when FAQ items exist.

## Search Preparation

`src/lib/search/search-document.ts` extended with:

- `expertise`, `technologies`, `concepts`, `entities`
- `embeddingVersion: null` reserved for future vector search

No vector index yet — metadata layer only.

## Analytics Preparation

Event definitions in `src/lib/analytics/events.ts`:

- `expertise_view`, `technology_view`
- `faq_expand`, `related_content_click`, `knowledge_graph_navigation`

No provider integration — definitions only.

## Future Semantic Search Roadmap

1. Generate embeddings from `SearchDocument` fields (title, description, entities)
2. Store vectors in Supabase pgvector or external index
3. Hybrid retrieval: keyword + vector + graph proximity scoring
4. Expose `/api/search` with semantic ranking
5. Use graph relationships as reranking signals

## API

`GET /api/knowledge-graph` returns:

```json
{
  "entities": [],
  "relationships": [],
  "expertise": [],
  "technologies": [],
  "concepts": []
}
```

## Database Changes

Migration: `supabase/migrations/20250621160000_knowledge_graph_registries.sql`

- New table: `technology_registry`
- New table: `concept_registry`
- `expertise_areas.related_expertise_slugs[]`
- Seeds: LangGraph, FastAPI, PostgreSQL, Supabase; hybrid-retrieval, citation-validation, agent-memory
- Expertise relationship seeds for rag-systems, multi-agent-systems, etc.

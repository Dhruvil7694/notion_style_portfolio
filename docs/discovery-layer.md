# Knowledge Discovery Layer (Phase 16)

Phase 16 adds unified search and discovery on top of the Phase 15 knowledge graph. This layer is **not** semantic search — no embeddings, vector databases, or AI chat.

## Goals

- Make the portfolio navigable as a knowledge system, not a flat collection of pages
- Provide fast keyword search across all entity types
- Rank results using graph relationships, not just text overlap
- Prepare APIs and document shapes for Phase 17 semantic search

## Architecture

```
src/lib/discovery/
├── types.ts        # DiscoveryDocument, clusters, navigation bundles
├── indexer.ts      # Server-side index from knowledge graph (cached)
├── ranking.ts      # Scoring engine (client + server safe)
├── search.ts       # Query, grouping, filtering
├── explorer.ts     # Topic clusters, explore sections, entity navigation
├── shortcuts.ts    # Keyboard shortcut helpers
└── index.ts        # Public exports
```

### Data flow

1. `buildKnowledgeGraph()` loads published CMS content and graph relationships
2. `buildDiscoveryIndexFromGraph()` normalizes every entity into a `DiscoveryDocument`
3. `buildDiscoveryIndex()` caches the index server-side (`unstable_cache`, 5 min)
4. `/api/discovery` exposes the index (and optional `?q=` grouped results)
5. Command palette and `/search` fetch the index once, then search client-side with the same ranking engine

## DiscoveryDocument

All content types normalize into one shape:

```ts
type DiscoveryDocument = {
  id: string
  type: "project" | "research" | "article" | "automation" | "expertise" | "technology" | "concept"
  title: string
  description: string
  slug: string
  url: string
  keywords: string[]
  expertise: string[]
  technologies: string[]
  concepts: string[]
  popularity: number
  updatedAt: string
  embedding?: number[]      // Phase 17
  semanticScore?: number    // Phase 17
}
```

Writing content maps to `type: "article"` in the discovery index.

## Ranking System

Weights in `ranking.ts`:

| Signal | Weight |
|--------|--------|
| Keyword match (title, description, keywords) | ×10 |
| Concept match | ×5 |
| Technology match | ×3 |
| Expertise match | ×2 |
| Knowledge graph relationship bonus | ×4 |
| Recency (180-day window) | ×1 |
| Popularity (inbound edges + featured) | ×0.5 |

Search quality is prioritized over micro-optimizations. The same functions run on the server (`/api/discovery?q=`) and in the client command palette.

## Command Palette

- **Shortcut:** ⌘K / Ctrl+K
- **Mount:** lazy-loaded via `DiscoveryShell` in `PublicLayout`
- **UI:** dark minimal modal matching existing portfolio tokens
- **Empty state:** popular topics, featured projects/concepts, recently viewed (localStorage)
- **Keyboard:** ↑ ↓ navigate, Enter select, Escape close

## Search Page

- Route: `/search?q=langgraph`
- Deep-linkable results page reusing the same engine as the palette
- Debounced query sync to URL

## Knowledge Explorer

- Route: `/explore`
- Sections: projects, research, writing, automations, expertise, technologies, concepts
- Highlights: popular topics, recently updated, featured expertise
- **Topic clusters:** auto-generated from high-signal anchors (expertise, concepts, popular technologies)
- Client-side filter across all indexed documents

## Entity Navigation

`resolveEntityNavigation()` computes graph-powered related entities for hub pages:

- Related expertise, technologies, concepts
- Co-occurring entities via shared content edges
- Used on `/expertise/[slug]`, `/technology/[slug]`, `/concept/[slug]`

## Discovery API

`GET /api/discovery`

- Without query: `{ documents, generatedAt }`
- With `?q=`: adds `{ query, results }` (grouped by type)

Future semantic search can extend this endpoint with embedding reranking without breaking clients.

## Analytics (definitions only)

Events added in `src/lib/analytics/events.ts`:

- `search_opened`
- `search_query`
- `search_result_click`
- `explore_navigation`
- `entity_navigation`

No analytics provider is wired yet.

## Future Semantic Search (Phase 17)

The index already reserves:

```ts
embedding?: number[]
semanticScore?: number
```

Planned approach (from knowledge graph architecture):

1. Generate embeddings for `DiscoveryDocument` text
2. Store in pgvector or external index
3. Hybrid rank: keyword score + semantic score + graph proximity
4. Portfolio Copilot uses `/api/discovery` + vector retrieval

## Future Portfolio Copilot

Phase 16 makes the knowledge base **discoverable**. Phase 17+ can add:

- Natural language queries over the same document index
- Graph-aware context assembly for answers
- Citation links back to entity pages

**Ready for Portfolio Copilot:** YES — unified index, ranking hooks, and API are in place.

## Validation Checklist

- ⌘K / Ctrl+K opens command palette
- Search spans all entity types
- Ranking uses graph-weighted scoring
- `/explore` renders clusters and sections
- Entity pages show graph-powered related entities
- `/search?q=` deep links work
- `/api/discovery` returns normalized documents
- Keyboard navigation in palette and search page
- `npm run typecheck` and `npm run build` pass

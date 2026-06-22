# Interactive Architecture System

Phase 10.7 introduces graph-based architecture diagrams for project case studies. Diagrams are stored as nodes and edges in Supabase, edited in the admin CMS, and rendered on public project pages with React Flow.

## Graph schema

### Nodes (`architecture_nodes`, `ai_design_nodes`)

```json
[
  {
    "id": "api",
    "type": "service",
    "label": "FastAPI Gateway",
    "description": "Request orchestration",
    "icon": "Server",
    "position": { "x": 0, "y": 0 }
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Stable node identifier |
| `type` | enum | yes | `user`, `agent`, `llm`, `database`, `service`, `tool`, `queue` |
| `label` | string | yes | Primary title shown on the node |
| `description` | string | no | Secondary line under the title |
| `icon` | string | no | Lucide icon name (e.g. `Bot`, `Database`) |
| `position` | `{ x, y }` | yes | Canvas coordinates persisted from the CMS editor |

### Edges (`architecture_edges`, `ai_design_edges`)

```json
[
  {
    "id": "edge-1",
    "source": "api",
    "target": "retriever",
    "label": "Query",
    "animated": false
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Stable edge identifier |
| `source` | string | yes | Source node id |
| `target` | string | yes | Target node id |
| `label` | string | no | Label rendered on the edge |
| `animated` | boolean | no | Dashed animated stroke |

Both AI design and system architecture diagrams share the same schema. They differ only in which database columns they use and which CMS section edits them.

## Node types

| Type | Icon default | Represents |
|------|--------------|------------|
| `user` | User | Analyst, researcher, customer, operator |
| `agent` | Bot | Research, validation, writer, planner agents |
| `llm` | Sparkles | GPT, Claude, Gemini |
| `database` | Database | PostgreSQL, vector store, Redis |
| `service` | Server | FastAPI, API gateway, orchestrator |
| `tool` | Wrench | Search, retrieval, external APIs |
| `queue` | Workflow | Kafka, RabbitMQ, event streams |

Node UI is intentionally neutral: muted background, minimal border, no color coding by type.

## Edge types

All edges render as smooth-step paths with optional labels:

- **Standard** — static stroke
- **Animated** — dashed stroke (`animated: true`)
- **Labeled** — label badge centered on the edge path

Common labels: Query, Validation, Embedding Search, Prompt, Response, Citation Check.

## Database

Migration: `supabase/migrations/20250621100000_project_architecture_graph_fields.sql`

```sql
architecture_nodes jsonb
architecture_edges jsonb
ai_design_nodes jsonb
ai_design_edges jsonb
```

Legacy linear-flow columns (`architecture`, `ai_design`) remain unchanged for backward compatibility. The Approach section still uses `approach text[]` with vertical steps.

## CMS editor

| Component | Purpose |
|-----------|---------|
| `ArchitectureGraphEditor` | System architecture graph builder |
| `AIDesignGraphEditor` | AI system architecture graph builder (defaults to agent nodes) |
| `LucideIconPicker` | Searchable Lucide icon picker with recent selections |

Admin capabilities:

- Add / delete nodes
- Edit title, description, type, icon
- Drag nodes to reposition
- Connect nodes via handles
- Delete selected node or edge
- Edit edge labels and animation

Location: Project form → **AI system architecture** and **System architecture** sections.

## React Flow implementation

| File | Role |
|------|------|
| `src/components/diagrams/architecture-diagram.tsx` | Public read-only viewer |
| `src/components/diagrams/architecture-diagram-lazy.tsx` | Dynamic import wrapper (no SSR) |
| `src/components/diagrams/architecture-node.tsx` | Custom node component |
| `src/components/diagrams/labeled-edge.tsx` | Edge with on-path label |
| `src/components/diagrams/diagram-toolbar.tsx` | Fit / zoom / reset controls |
| `src/lib/diagrams/react-flow-adapters.ts` | DB graph ↔ React Flow conversion |

### View modes

- **Desktop** — interactive pan/zoom, toolbar in top-right
- **Mobile** — auto-fit width, no horizontal overflow, scroll/pinch disabled for static reading

React Flow CSS is imported only in client diagram components. Diagrams load via `next/dynamic` with `ssr: false`.

## Public project page

Sections renamed:

| Before | After |
|--------|-------|
| AI Design Flow | AI System Architecture |
| Architecture Flow | System Architecture |

Approach, Challenges, Results, and other narrative sections are unchanged.

## Future roadmap (Phase 11+)

The graph model is designed to extend toward:

- Cover images and system screenshots on nodes
- Video demo attachments
- Clickable nodes with documentation side panels
- Architecture annotations and callouts
- Multi-page / layered architecture views
- Asset management integration for node media

## Key files

**Created**

- `supabase/migrations/20250621100000_project_architecture_graph_fields.sql`
- `src/lib/diagrams/architecture-graph.schema.ts`
- `src/lib/diagrams/architecture-node-types.ts`
- `src/lib/diagrams/lucide-icons.ts`
- `src/lib/diagrams/react-flow-adapters.ts`
- `src/components/diagrams/*`
- `src/features/admin/forms/architecture-graph-editor.tsx`
- `src/features/admin/forms/ai-design-graph-editor.tsx`
- `src/features/admin/forms/lucide-icon-picker.tsx`
- `src/hooks/use-is-mobile-viewport.ts`

**Modified**

- `src/lib/admin/schemas/project.ts`
- `src/lib/admin/actions/projects.ts`
- `src/features/admin/forms/project-form.tsx`
- `src/components/public/project-case-study.tsx`
- `src/types/database.ts`
- `src/app/globals.css`
- `package.json`

**Preserved**

- `NodeFlowField` / `JointFlowDiagram` — no longer used for architecture sections but kept for Approach-adjacent legacy tooling if needed
- `approach` vertical step flow — unchanged

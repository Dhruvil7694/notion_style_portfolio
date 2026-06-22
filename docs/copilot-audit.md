# CMS Copilot — Audit & Redesign

Status: 2026-06-21. Authored after first iteration of chat → tool flow shipped (about-section editor with variants + confirm + read-after-write verify).

## What the copilot does today

End-to-end flow:

1. Admin types message in `/admin/copilot`.
2. `POST /api/copilot/chat` → `runCopilotWorkflow(message, history)`.
3. LangGraph workflow: `detectIntent` → `buildContext` → `selectTools` (regex) → `executeTools` → `validate` → `respond`.
4. `respondNode` either returns a hand-written preview message (for `updateAboutSection`) or invokes the chat model with tool results stuffed into the system prompt.
5. Response streamed to client. `pendingActions` arrive in the `done` event; client renders a `PendingActionCard` with **Confirm** / **Cancel** / **Regenerate** buttons.
6. Confirm/Cancel POSTs back as a structured action; server executes the tool with `confirmed: true`, reads-after-writes, returns final text + redirect URL.

## What's actually wired

### Admin server actions (the contract every form already trusts)

| File | Actions |
|------|---------|
| `settings.ts` | `updateOwnerAvatar`, `updateAboutAvatar`, `updateProfile`, `updateAbout`, `updateSettings` |
| `projects.ts` | `createProject`, `updateProject`, `deleteProject` |
| `skills.ts` | `createSkill`, `updateSkill`, `deleteSkill` |
| `concepts.ts` | `createConceptEntry`, `updateConceptEntry`, `deleteConceptEntry` |
| `technologies.ts` | `createTechnologyEntry`, `updateTechnologyEntry`, `deleteTechnologyEntry` |
| `expertise.ts` | `createExpertiseArea`, `updateExpertiseArea`, `deleteExpertiseArea` |
| `content.ts` | `createContent`, `updateContent`, `deleteContent` |
| `experience.ts` | `createExperience`, `updateExperience`, `deleteExperience` |
| `education.ts` | `createEducation`, `updateEducation`, `deleteEducation` |
| `ai-settings.ts` | `updateAiSettings` |
| `uploads.ts` | `uploadProjectCoverImage`, `uploadProjectDemoImage`, `uploadProfileAvatar` |

Each follows the same shape:

```ts
"use server"
export async function updateX(input: unknown): Promise<ActionResult> {
  const parsed = xPersistSchema.safeParse(input)
  if (!parsed.success) return actionError("Validation failed", zodFieldErrors(parsed.error))
  const supabase = await getAdminMutationClient()
  // ... write ...
  revalidatePublicSite()
  return { success: true, data: undefined }
}
```

Forms invoke them with `react-hook-form` + `zodResolver(xFormSchema)`. Validation, error mapping, revalidation are all already solved here.

### Copilot tool registry (today)

`src/lib/copilot/tools/types.ts` lists 25 tools. They split into:

- **Read-only:** `auditProject`, `auditPortfolio`, `searchKnowledgeGraph`, `suggestRelationships`.
- **Generate preview:** `generateAiSummary`, `generateFaq`, `generateKeyTakeaways`, `generateTradeoffs`, `generateCaseStudy`.
- **Project field apply:** `applyFaq`, `applySummary`, `applyTakeaways`, `applyTradeoffs`, `applyTechnologies`, `applyExpertise`, `applyConcepts`, `applyRelationships` (all hit `projects` table directly).
- **Entity create:** `createProject`, `updateProject`, `createSkill`, `updateSkill`, `createTechnology`, `createConcept` (direct Supabase inserts — bypass form schemas).
- **About edit:** `updateAboutSection` (variants + read-after-write, the only one that actually works end-to-end).
- **Placeholders:** `createContent`, `updateContent` (return "requires form validation, use the CMS editor").

## Gap analysis (root causes)

### G1 — Tool selection is regex routing, not model intent

`selectToolsNode` matches `/audit|health|missing|quality|score/` etc. and hand-picks a tool. The LLM is downstream; it doesn't choose tools. Consequences:

- "Rewrite my education at IIT" → no match → no tool. Model hallucinates progress.
- "Add a skill called LangGraph" → matches `create` → calls `createSkill` with `{name: "Add"}` (`extractSlug` regex is wrong for skills).
- New entity coverage requires adding regex branches by hand. Doesn't scale.

### G2 — Tools duplicate logic the forms already validate

`createProject` in `executor.ts` inserts directly:

```ts
.insert({ title, slug, summary, status: "draft", tech_stack: [], ... })
```

Bypasses `projectPersistSchema` (which enforces slug shape, status enum, required fields, defaults). A copilot-created project can therefore be invalid in ways the admin form would reject. **The same Zod schema should validate both surfaces.**

### G3 — Most entities have no copilot coverage at all

No `updateExperience`, `updateEducation`, `updateExpertiseArea`, `updateConceptEntry`, `updateTechnologyEntry`, `updateContent` (real one), `updateProfile`, `updateSettings`. The copilot can ask the admin to "use the CMS editor" — defeating the purpose.

### G4 — Preview UI is hardcoded per tool

`PendingActionCard` checks `preview.kind === "about_edit"` and renders variants; otherwise renders `preview.after` if present. Every new entity needs a new branch. No generic "here's a diff of fields A, B, C" rendering.

### G5 — No real LLM function calling

The Vercel AI SDK has `streamText({tools})` / `generateText({tools})` with native tool calling. We have it installed (`ai` v6, all `@ai-sdk/*` packages). We're not using it for routing. We use it only for prose generation in `respondNode`.

### G6 — Server action revalidation isn't reused

Each action calls `revalidatePublicSettings()` / `revalidatePublicSiteData()` and `revalidatePath(...)`. Copilot tools re-implement revalidation per case, with different coverage. About edit revalidates `/about` + `/`; project field apply revalidates only the knowledge graph cache tags. Inconsistent.

### G7 — No "list entities" or "find by name" tool

The copilot can't enumerate. "Show all skills", "find the project about RAG with the highest health score", "which experiences have no description" — all impossible without read tools that walk the admin schema.

### G8 — No undo / audit visibility

`copilot_actions` table exists and logs writes, but there's no `/admin/copilot/history` page and no undo. If the LLM picks the wrong field, the admin has to fix it manually.

### G9 — Pending action state lives only on one message

Confirming or cancelling clears `pendingActions` on the source message. If the same conversation has two stacked pendings (e.g. "update intro and create LangGraph skill"), the second card can be orphaned by reload.

### G10 — Failure surface is thin

Failures inside a tool become a `success: false` toolResult, then `validateNode` sets `state.error`, then the response text says "couldn't complete that". No structured error UI; admin can't tell whether it was a Zod failure (their fault: missing field) vs a write failure (server fault) vs an LLM failure (try again).

## Target architecture

### A1 — One tool per server action, schema-shared

```
src/lib/copilot/tools/registry/
  index.ts                     # buildCopilotTools(): Record<string, Tool>
  about.ts                     # updateAboutSection, updateProfile, updateSettings
  projects.ts                  # createProject, updateProject, applyProjectField
  skills.ts                    # createSkill, updateSkill, deleteSkill
  experience.ts, education.ts, expertise.ts,
  concepts.ts, technologies.ts, content.ts,
  read.ts                      # listSkills, getProject, auditPortfolio, ...
```

Each file exports `Tool` instances built with Vercel AI SDK:

```ts
import { tool } from "ai"
import { z } from "zod"
import { updateAbout } from "@/lib/admin/actions/settings"
import { aboutPageFormSchema } from "@/lib/admin/schemas"

export const updateAboutFull = tool({
  description: "Replace one or more About-page paragraphs. Show a diff first.",
  inputSchema: aboutPageFormSchema.partial(),
  execute: async (input) => {
    // preview mode handled at orchestrator level; this is the write side
    const result = await updateAbout({ ...(await loadCurrentAbout()), ...input })
    return result
  },
})
```

Reuse the persist schema as the tool's `inputSchema`. The LLM gets the exact shape the form already trusts. The action does the write + revalidation. No duplication.

### A2 — LLM picks tools via `streamText({tools})`

Replace `selectToolsNode` + `executeToolsNode` with a single agent step:

```ts
const { toolCalls, text } = await generateText({
  model: copilotModel,
  system: COPILOT_AGENT_PROMPT,
  messages,
  tools: buildCopilotTools(),
  toolChoice: "auto",
  stopWhen: stepCountIs(5),
})
```

LLM emits structured tool calls with validated args (Zod). No regex. New entities = drop a new tool file.

### A3 — Two-phase: plan → preview → confirm → execute

Tools split into two layers:

- **`plan*` / `propose*` tools** (LLM can call freely) — compute preview, write nothing. Return a `pendingAction` payload with `currentValue`, `proposedValue`, `diffFields`.
- **`apply*` tools** (server-only, never exposed to LLM) — invoked when admin clicks Confirm. Wrap the actual server action.

The agent prompt makes this explicit: "Use `propose*` tools to draft changes; never write directly. The admin will confirm."

### A4 — Generic `FieldDiffPreview` component

```tsx
<FieldDiffPreview
  entityLabel="Project · BohrAI"
  fields={[
    { name: "summary",   before: "...", after: "..." },
    { name: "key_takeaways", before: ["...", "..."], after: ["...", "...", "..."] },
  ]}
/>
```

Strings → before/after panels. Arrays → added/removed/unchanged badges. Objects → recursive. AboutEditPreview stays only for the *variants* case.

### A5 — Single revalidation entrypoint per entity

Each server action already revalidates. Tool just calls the action. No more per-tool `revalidate*` calls — that's the action's job and it already does it.

### A6 — Structured failure surface

`PendingActionCard` and post-confirm rendering recognise three states:

- `validation_error` (Zod fieldErrors) — show per-field errors inline.
- `write_error` (Supabase error) — show DB error + retry button.
- `llm_error` (rewrite failed) — show "try again" + regenerate.

### A7 — Read tools for enumeration

`listSkills`, `listProjects(filter?)`, `getProjectBySlug`, `getAboutContent`, etc. — read-only, no confirm needed. The agent uses them before proposing changes so previews are always grounded in real DB state.

### A8 — Copilot action history page (next phase)

`/admin/copilot/history` reads `copilot_actions`, shows applied changes, allows undo by re-issuing the inverse mutation. Not in this PR.

## Phased plan

| Phase | Scope | Status |
|-------|-------|--------|
| **A** | Foundation: registry skeleton, 3 entities (about, skills, profile), LLM tool calling, generic diff UI | this PR |
| **B** | Extend coverage: projects/content/experience/education/expertise/concepts/technologies | next PR |
| **C** | History + undo via `copilot_actions`, multi-step plans, parallel tool calls | later |
| **D** | Streaming tool execution (UI shows tool start/finish in real time) | later |

## What this PR will change

1. New `src/lib/copilot/tools/registry/` with three entity files + `index.ts` aggregator.
2. New `src/lib/copilot/agent.ts` — wraps `generateText({tools})`, returns `{text, pendingActions, toolResults}`.
3. `workflow.ts` collapses: keep context fetch, drop intent regex, drop `selectToolsNode`/`executeToolsNode`/`validateNode`, drop hand-rolled `respondNode`. New shape: `prepareContext` → `runAgent` → `formatResponse`.
4. `chat/route.ts` keeps the confirm/cancel/regenerate action paths; calls a registry lookup instead of the executor.
5. `copilot-client.tsx` — add `FieldDiffPreview` for non-about pending actions; keep about variants intact.
6. Deprecate `src/lib/copilot/tools/executor.ts` (kept for one release; new code uses registry).

## Non-goals (explicitly out of scope)

- Multi-message tool-call streaming (Phase D).
- Undo UI (Phase C).
- Auto-generation of every field via LLM (manual instruction still required from admin).
- Removing `copilot_actions` audit table — staying.

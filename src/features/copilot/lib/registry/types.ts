import "server-only"

import type { z } from "zod"

export type DiffField = {
  /** Human-readable field name shown in preview UI. */
  name: string
  /** Underlying entity field key (used by apply step). */
  key?: string
  before: unknown
  after: unknown
}

export type PendingActionPayload = {
  /** Display label, e.g. "Apply intro rewrite". */
  label: string
  /** Optional secondary description. */
  description?: string
  /** Entity heading, e.g. "About · intro" or "Skill · LangGraph". */
  entityLabel: string
  /** Name of the apply tool to invoke on confirm. */
  applyTool: string
  /** Args passed to the apply tool. */
  applyArgs: Record<string, unknown>
  /** Fields to render as before/after diff. */
  fields: DiffField[]
  /** Optional variant choices — admin picks one before confirming. */
  variants?: Array<{ label: string; value: string }>
  /** Optional public URL to open after apply. */
  redirectUrl?: string
  redirectLabel?: string
  /** When provided, applyArgs[fieldKey] is overridden by the selected variant's value. */
  variantArgKey?: string
  /** Propose tool name — populated so the client can trigger Regenerate. */
  proposeTool?: string
  /** Original args to the propose tool — passed back on Regenerate. */
  proposeArgs?: Record<string, unknown>
  /** When set, this is a clarification request instead of a change proposal. */
  clarificationQuestion?: string
  clarificationOptions?: Array<{
    label: string
    value: string
    description?: string
  }>
  /** Whether to show a free-text input alongside the option buttons. */
  allowCustom?: boolean
}

export type ProposeToolResult =
  | { ok: true; pending: PendingActionPayload }
  | { ok: false; error: string }

export type ReadToolResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type ApplyToolResult = {
  success: boolean
  error?: string
  data?: {
    message?: string
    finalText?: string
    redirectUrl?: string
    redirectLabel?: string
    [key: string]: unknown
  }
}

export type CopilotProposeTool<Schema extends z.ZodTypeAny = z.ZodTypeAny> = {
  kind: "propose"
  name: string
  description: string
  inputSchema: Schema
  build: (args: z.input<Schema>) => Promise<ProposeToolResult>
}

export type CopilotReadTool<
  Schema extends z.ZodTypeAny = z.ZodTypeAny,
  Out = unknown,
> = {
  kind: "read"
  name: string
  description: string
  inputSchema: Schema
  execute: (args: z.input<Schema>) => Promise<ReadToolResult<Out>>
}

export type CopilotApplyTool<Schema extends z.ZodTypeAny = z.ZodTypeAny> = {
  kind: "apply"
  name: string
  description: string
  inputSchema: Schema
  execute: (args: z.input<Schema>) => Promise<ApplyToolResult>
}

export type CopilotTool =
  | CopilotProposeTool
  | CopilotReadTool
  | CopilotApplyTool

export type CopilotRegistry = {
  propose: Record<string, CopilotProposeTool>
  read: Record<string, CopilotReadTool>
  apply: Record<string, CopilotApplyTool>
}

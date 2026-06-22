import "server-only"

import { z } from "zod"

import type { CopilotProposeTool } from "./types"

const askClarificationSchema = z.object({
  question: z.string().min(1).describe("The question to ask the admin."),
  context: z
    .string()
    .optional()
    .describe("One sentence: what task are you trying to complete once you have the answer."),
  options: z
    .array(
      z.object({
        label: z.string().describe("Button label shown in UI."),
        value: z.string().describe("Value sent back as the admin's answer."),
        description: z.string().optional().describe("Optional short description below the label."),
      })
    )
    .min(1)
    .max(6)
    .describe("2–6 concrete options for the admin to pick from."),
  allowCustom: z
    .boolean()
    .default(true)
    .describe("Whether to show a free-text input for a custom answer."),
})

export const askClarificationTool: CopilotProposeTool<
  typeof askClarificationSchema
> = {
  kind: "propose",
  name: "askClarification",
  description: `Ask the admin a clarifying question when required information is missing or ambiguous.
Use this when:
- A required field (e.g. skill category, experience company name) is not specified.
- The user's intent is ambiguous (e.g. "add a project" — for which project?).
- Multiple valid options exist and you should not guess.
Always provide concrete option buttons. The admin clicks one and you continue the task.`,
  inputSchema: askClarificationSchema,
  async build(rawArgs) {
    const parsed = askClarificationSchema.parse(rawArgs)
    return {
      ok: true,
      pending: {
        label: parsed.question,
        description: parsed.context,
        entityLabel: "Question for you",
        applyTool: "__clarify__",
        applyArgs: {},
        fields: [],
        clarificationQuestion: parsed.question,
        clarificationOptions: parsed.options,
        allowCustom: parsed.allowCustom ?? true,
        proposeTool: "askClarification",
        proposeArgs: { ...parsed },
      },
    }
  },
}

export const clarificationRegistry = {
  read: {},
  propose: { [askClarificationTool.name]: askClarificationTool },
  apply: {},
}

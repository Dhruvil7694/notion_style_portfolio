import { z } from "zod"

export const faqItemSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
  answer: z.string().trim().min(1, "Answer is required"),
})

export type FaqItem = z.infer<typeof faqItemSchema>

export const projectFactsSchema = z.record(
  z.string().trim().min(1),
  z.string().trim().min(1)
)

export type ProjectFacts = z.infer<typeof projectFactsSchema>

export const projectTradeoffV2Schema = z.object({
  decision: z.string().trim().min(1, "Decision is required"),
  alternative: z.string().trim().optional().or(z.literal("")),
  reason: z.string().trim().optional().or(z.literal("")),
  tradeoff: z.string().trim().optional().or(z.literal("")),
})

export type ProjectTradeoffV2 = z.infer<typeof projectTradeoffV2Schema>

export function parseFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const parsed = faqItemSchema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
}

export function parseProjectFacts(value: unknown): ProjectFacts {
  const parsed = projectFactsSchema.safeParse(value)
  return parsed.success ? parsed.data : {}
}

export function parseTradeoffItems(value: unknown): ProjectTradeoffV2[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const parsed = projectTradeoffV2Schema.safeParse(item)
    if (!parsed.success) {
      return []
    }

    const { decision, alternative, reason, tradeoff } = parsed.data
    if (!decision.trim()) {
      return []
    }

    return [
      {
        decision,
        alternative: alternative?.trim() || "",
        reason: reason?.trim() || tradeoff?.trim() || "",
        tradeoff: tradeoff?.trim() || "",
      },
    ]
  })
}

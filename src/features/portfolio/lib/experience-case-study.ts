import { z } from "zod"

const experienceProjectDetailSchema = z.object({
  name: z.string().min(1),
  business_problem: z.string().min(1),
  contribution: z.string().min(1),
  technologies: z.string().min(1),
  outcome: z.string().min(1),
})

const experienceChallengeDetailSchema = z.object({
  challenge: z.string().min(1),
  constraints: z.array(z.string().min(1)).min(1),
  solution: z.array(z.string().min(1)).min(1),
  outcome: z.array(z.string().min(1)).min(1),
})

export const experienceCaseStudySchema = z.object({
  hire_summary: z.string().min(1).optional(),
  hire_scope: z.array(z.string().min(1)).optional(),
  hire_ownership: z.array(z.string().min(1)).optional(),
  hire_context: z.array(z.string().min(1)).optional(),
  business_problems: z.array(z.string().min(1)).optional(),
  projects: z.array(experienceProjectDetailSchema).optional(),
  automation: z.array(z.string().min(1)).optional(),
  systems: z.array(z.string().min(1)).optional(),
  hardest_challenge: experienceChallengeDetailSchema.optional(),
  tradeoffs: z.array(z.string().min(1)).optional(),
  learnings: z.array(z.string().min(1)).optional(),
  impact: z.array(z.string().min(1)).optional(),
})

export type ExperienceCaseStudy = z.infer<typeof experienceCaseStudySchema>
export type ExperienceProjectDetail = z.infer<
  typeof experienceProjectDetailSchema
>

export function parseExperienceCaseStudy(
  value: unknown
): ExperienceCaseStudy | null {
  const parsed = experienceCaseStudySchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function hasExperienceCaseStudy(value: unknown): boolean {
  const data = parseExperienceCaseStudy(value)
  if (!data) {
    return false
  }

  return Object.values(data).some((entry) => {
    if (Array.isArray(entry)) {
      return entry.length > 0
    }

    if (entry && typeof entry === "object") {
      return Object.values(entry).some(
        (nested) => Array.isArray(nested) && nested.length > 0
      )
    }

    return typeof entry === "string" && entry.trim().length > 0
  })
}

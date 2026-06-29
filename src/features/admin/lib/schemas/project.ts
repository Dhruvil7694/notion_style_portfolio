import { z } from "zod"

import {
  architectureGraphEdgeSchema,
  architectureGraphNodeSchema,
} from "@/features/diagrams/lib/architecture-graph.schema"
import {
  faqItemSchema,
  projectFactsSchema,
} from "@/features/knowledge-base/lib/schemas"
import {
  flattenTechStackGroups,
  projectChallengeSchema,
  projectFlowNodeSchema,
  projectGalleryItemSchema,
  projectMetricSchema,
  projectTimelineEntrySchema,
  projectTradeoffSchema,
} from "@/features/portfolio/lib/project-case-study"

import {
  commaListFieldSchema,
  formContentDocumentSchema,
  optionalUrlSchema,
  publishableStatusSchema,
  slugSchema,
} from "./common"

const iconifyIdSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9._-]*$/i,
    "Must be a valid Iconify identifier (e.g. lucide:brain)"
  )

export const projectFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    slug: slugSchema,
    summary: z.string().trim().min(1, "Summary is required").max(500),
    tagline: z
      .string()
      .trim()
      .max(120, "Tagline must be 120 characters or less")
      .optional()
      .or(z.literal("")),
    icon_name: iconifyIdSchema.optional().or(z.literal("")),
    cover_image: optionalUrlSchema,
    thumbnail: optionalUrlSchema,
    demo_video_url: optionalUrlSchema,
    architecture_image: optionalUrlSchema,
    year: z.string().trim().max(20).optional().or(z.literal("")),
    category: z.string().trim().max(80).optional().or(z.literal("")),
    role: z.string().trim().max(80).optional().or(z.literal("")),
    project_url: optionalUrlSchema,
    github_url: optionalUrlSchema,
    challenge: z
      .string()
      .trim()
      .max(300, "Challenge must be 300 characters or less")
      .optional()
      .or(z.literal("")),
    solution: z
      .string()
      .trim()
      .max(300, "Solution must be 300 characters or less")
      .optional()
      .or(z.literal("")),
    impact: z
      .string()
      .trim()
      .max(300, "Impact must be 300 characters or less")
      .optional()
      .or(z.literal("")),
    overview: z
      .string()
      .trim()
      .max(500, "Overview must be 500 characters or less")
      .optional()
      .or(z.literal("")),
    problem: z.string().trim().optional().or(z.literal("")),
    why_built: z.string().trim().optional().or(z.literal("")),
    approach: z
      .array(z.string().trim().min(1, "Step cannot be empty"))
      .default([])
      .transform((items) => items.filter(Boolean)),
    ai_design: z
      .array(projectFlowNodeSchema)
      .default([])
      .transform((items) => items.filter((item) => item.label.trim())),
    architecture: z
      .array(projectFlowNodeSchema)
      .default([])
      .transform((items) => items.filter((item) => item.label.trim())),
    ai_design_nodes: z
      .array(architectureGraphNodeSchema)
      .default([])
      .transform((items) => items.filter((item) => item.label.trim())),
    ai_design_edges: z
      .array(architectureGraphEdgeSchema)
      .default([])
      .transform((items) =>
        items.filter((item) => item.source.trim() && item.target.trim())
      ),
    architecture_nodes: z
      .array(architectureGraphNodeSchema)
      .default([])
      .transform((items) => items.filter((item) => item.label.trim())),
    architecture_edges: z
      .array(architectureGraphEdgeSchema)
      .default([])
      .transform((items) =>
        items.filter((item) => item.source.trim() && item.target.trim())
      ),
    metrics: z
      .array(projectMetricSchema)
      .default([])
      .transform((items) =>
        items.filter((item) => item.label.trim() && item.value.trim())
      ),
    tradeoffs: z
      .array(projectTradeoffSchema)
      .default([])
      .transform((items) =>
        items.filter(
          (item) =>
            item.decision.trim() &&
            (item.reason?.trim() || item.tradeoff?.trim())
        )
      ),
    my_contribution: z
      .array(z.string().trim().min(1, "Contribution cannot be empty"))
      .default([])
      .transform((items) => items.filter(Boolean)),
    tech_stack_groups: z
      .array(
        z.object({
          category: z.string().trim(),
          items: z.array(z.string().trim()).default([]),
        })
      )
      .default([])
      .transform((groups) =>
        groups
          .map((group) => ({
            category: group.category.trim(),
            items: group.items.map((item) => item.trim()).filter(Boolean),
          }))
          .filter((group) => group.category && group.items.length > 0)
      ),
    timeline: z
      .array(projectTimelineEntrySchema)
      .default([])
      .transform((items) =>
        items.filter((item) => item.period.trim() && item.title.trim())
      ),
    gallery: z
      .array(
        z.object({
          url: z.string().trim(),
          type: z
            .enum([
              "screenshot",
              "diagram",
              "workflow",
              "dashboard",
              "research",
              "demo",
              "layout",
            ])
            .default("screenshot"),
          caption: z.string().trim().optional().or(z.literal("")),
          alt: z.string().trim().optional().or(z.literal("")),
        })
      )
      .default([])
      .transform((items) =>
        items.flatMap((item) => {
          if (!item.url.trim()) {
            return []
          }

          const parsed = projectGalleryItemSchema.safeParse(item)
          return parsed.success ? [parsed.data] : []
        })
      ),
    challenges: z
      .array(projectChallengeSchema)
      .default([])
      .transform((items) =>
        items.filter((item) => item.challenge.trim() && item.solution.trim())
      ),
    results: z
      .array(z.string().trim().min(1, "Result cannot be empty"))
      .default([])
      .transform((items) => items.filter(Boolean)),
    learnings: z
      .array(z.string().trim().min(1, "Learning cannot be empty"))
      .default([])
      .transform((items) => items.filter(Boolean)),
    ai_summary: z.string().trim().optional().or(z.literal("")),
    key_takeaways: z
      .array(z.string().trim().min(1, "Takeaway cannot be empty"))
      .default([])
      .transform((items) => items.filter(Boolean)),
    concepts: commaListFieldSchema,
    expertise_slugs: z
      .array(z.string().trim())
      .default([])
      .transform((items) => items.filter(Boolean)),
    technologies: commaListFieldSchema,
    project_facts: projectFactsSchema.default({}),
    faq: z
      .array(faqItemSchema)
      .default([])
      .transform((items) =>
        items.filter((item) => item.question && item.answer)
      ),
    hover_preview_enabled: z.boolean(),
    display_order: z.coerce
      .number()
      .int()
      .min(0, "Display order must be a positive integer"),
    tech_stack: commaListFieldSchema,
    featured: z.boolean(),
    status: publishableStatusSchema,
    content: formContentDocumentSchema,
  })
  .transform((data) => {
    const groupedStack = flattenTechStackGroups(data.tech_stack_groups)
    const tech_stack = groupedStack.length > 0 ? groupedStack : data.tech_stack

    return { ...data, tech_stack }
  })

export type ProjectFormValues = z.input<typeof projectFormSchema>
export type ProjectFormData = z.output<typeof projectFormSchema>

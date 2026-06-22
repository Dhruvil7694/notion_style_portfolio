import { z } from "zod"

import { optionalUrlSchema, parseCommaList, publishableStatusSchema, slugSchema } from "./common"

export const technologyFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  slug: slugSchema,
  description: z.string().trim().optional().or(z.literal("")),
  summary: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
  website_url: optionalUrlSchema,
  documentation_url: optionalUrlSchema,
  featured: z.boolean(),
  display_order: z.coerce.number().int().min(0),
  status: publishableStatusSchema,
})

export type TechnologyFormValues = z.input<typeof technologyFormSchema>
export type TechnologyFormData = z.output<typeof technologyFormSchema>

export const conceptFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  slug: slugSchema,
  description: z.string().trim().optional().or(z.literal("")),
  summary: z.string().trim().optional().or(z.literal("")),
  why_it_matters: z.string().trim().optional().or(z.literal("")),
  related_concept_slugs: z.string().transform(parseCommaList),
  related_expertise_slugs: z.string().transform(parseCommaList),
  featured: z.boolean(),
  display_order: z.coerce.number().int().min(0),
  status: publishableStatusSchema,
})

export type ConceptFormValues = z.input<typeof conceptFormSchema>
export type ConceptFormData = z.output<typeof conceptFormSchema>

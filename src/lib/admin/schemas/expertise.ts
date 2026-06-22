import { z } from "zod"

import { parseCommaList, publishableStatusSchema, slugSchema } from "./common"

export const expertiseFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  slug: slugSchema,
  description: z.string().trim().optional().or(z.literal("")),
  summary: z.string().trim().optional().or(z.literal("")),
  why_it_matters: z.string().trim().optional().or(z.literal("")),
  key_takeaways: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((items) => items.filter(Boolean)),
  keywords: z.string().transform(parseCommaList),
  related_expertise_slugs: z.string().transform(parseCommaList),
  icon_name: z.string().trim().optional().or(z.literal("")),
  featured: z.boolean(),
  display_order: z.coerce.number().int().min(0),
  status: publishableStatusSchema,
})

export type ExpertiseFormValues = z.input<typeof expertiseFormSchema>
export type ExpertiseFormData = z.output<typeof expertiseFormSchema>

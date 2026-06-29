import { z } from "zod"

import { faqItemSchema } from "@/features/knowledge-base/lib/schemas"

import {
  commaListFieldSchema,
  formContentDocumentSchema,
  publishableStatusSchema,
  slugSchema,
} from "./common"

export const contentTypeSchema = z.enum([
  "blog",
  "research",
  "automation",
  "publication",
  "note",
])

export const contentFormSchema = z.object({
  type: contentTypeSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  excerpt: z
    .string()
    .trim()
    .max(500)
    .transform((value) => (value.length === 0 ? null : value)),
  tags: commaListFieldSchema,
  status: publishableStatusSchema,
  content: formContentDocumentSchema,
  ai_summary: z.string().trim().optional().or(z.literal("")),
  key_takeaways: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((items) => items.filter(Boolean)),
  expertise_slugs: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((items) => items.filter(Boolean)),
  concepts: commaListFieldSchema,
  faq: z.array(faqItemSchema).default([]),
})

export type ContentFormValues = z.input<typeof contentFormSchema>
export type ContentFormData = z.output<typeof contentFormSchema>

import { z } from "zod"

import { parseCommaList, parseLines } from "./common"

export const experienceFormSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required"),
    role: z.string().trim().min(1, "Role is required"),
    location: z
      .string()
      .trim()
      .transform((value) => (value.length === 0 ? null : value)),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z
      .string()
      .trim()
      .transform((value) => (value.length === 0 ? null : value)),
    description: z
      .string()
      .trim()
      .transform((value) => (value.length === 0 ? null : value)),
    achievements: z.string().transform(parseLines),
    tech_stack: z.string().transform(parseCommaList),
  })
  .refine(
    (data) =>
      !data.end_date || !data.start_date || data.end_date >= data.start_date,
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  )

export type ExperienceFormValues = z.input<typeof experienceFormSchema>
export type ExperienceFormData = z.output<typeof experienceFormSchema>

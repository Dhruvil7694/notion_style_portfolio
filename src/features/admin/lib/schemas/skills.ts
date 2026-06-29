import { z } from "zod"

export const skillCategorySchema = z.enum([
  "language",
  "framework",
  "tool",
  "cloud",
  "ai_ml",
  "soft",
  "other",
])

export const skillProficiencySchema = z.enum([
  "learning",
  "proficient",
  "expert",
])

export const skillFormSchema = z.object({
  category: skillCategorySchema,
  name: z.string().trim().min(1, "Name is required"),
  proficiency: z
    .union([skillProficiencySchema, z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  show_on_landing: z.boolean(),
})

export type SkillFormValues = z.input<typeof skillFormSchema>
export type SkillFormData = z.output<typeof skillFormSchema>

import { z } from "zod"

export const educationFormSchema = z.object({
  institution: z.string().trim().min(1, "Institution is required"),
  degree: z.string().trim().min(1, "Degree is required"),
  description: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value)),
})

export type EducationFormValues = z.input<typeof educationFormSchema>
export type EducationFormData = z.output<typeof educationFormSchema>

import { z } from "zod"

import { type ContentDocument,contentDocumentSchema } from "@/lib/content/schema"

export const publishableStatusSchema = z.enum(["draft", "published"])

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(200)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens")

export const optionalUrlSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.union([z.string().url("Enter a valid URL"), z.null()]))

export function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function linesToText(values: string[] | null | undefined): string {
  return (values ?? []).join("\n")
}

export function commaListToText(values: string[] | null | undefined): string {
  return (values ?? []).join(", ")
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export function actionError(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return { success: false, error: message, fieldErrors }
}

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      continue
    }

    const key = issue.path.join(".")
    fieldErrors[key] ??= []
    fieldErrors[key].push(issue.message)
  }

  return fieldErrors
}

export function resolvePublishedAt(
  status: "draft" | "published",
  existingPublishedAt: string | null | undefined
): string | null {
  if (status === "published") {
    return existingPublishedAt ?? new Date().toISOString()
  }

  return null
}

export const formContentDocumentSchema = z.custom<ContentDocument>(
  (value) => contentDocumentSchema.safeParse(value).success,
  "Invalid content document"
)

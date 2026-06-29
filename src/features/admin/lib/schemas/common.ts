import { z } from "zod"

import {
  type ContentDocument,
  contentDocumentSchema,
} from "@/features/content/lib/schema"

export const publishableStatusSchema = z.enum(["draft", "published"])

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(200)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens"
  )

function normalizeOptionalUrlInput(value: unknown): string {
  if (value == null) {
    return ""
  }

  return String(value)
}

/** Accepts empty/null from DB and form controls; outputs a valid URL or null. */
export const optionalUrlSchema = z.preprocess(
  normalizeOptionalUrlInput,
  z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(z.union([z.string().url("Enter a valid URL"), z.null()]))
)

export type OptionalUrlValidationState = "empty" | "valid" | "invalid"

/** Live URL field feedback — matches optionalUrlSchema rules (empty is neutral). */
export function getOptionalUrlValidationState(
  value: string
): OptionalUrlValidationState {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return "empty"
  }

  return z.string().url().safeParse(trimmed).success ? "valid" : "invalid"
}

function normalizeCommaListField(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join(", ")
  }

  if (value == null) {
    return ""
  }

  return String(value)
}

/** Comma-separated form field — accepts string or string[] (e.g. after Zod transform round-trip). */
export const commaListFieldSchema = z.preprocess(
  normalizeCommaListField,
  z.string().transform(parseCommaList)
)

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

"use client"

import { useState, useTransition } from "react"
import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import type { ActionResult } from "@/lib/admin/schemas"

export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  fieldErrors?: Record<string, string[]>
) {
  if (!fieldErrors) {
    return
  }

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) {
      setError(field as Path<TFieldValues>, { message: messages[0] })
    }
  }
}

export function useFormSubmission() {
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit<T = void>(action: () => Promise<ActionResult<T>>) {
    return new Promise<ActionResult<T>>((resolve) => {
      startTransition(async () => {
        setFormError(null)
        const result = await action()
        if (!result?.success) {
          setFormError(result?.error ?? "Something went wrong. Try again.")
        }
        resolve(result ?? { success: false, error: "Something went wrong. Try again." })
      })
    })
  }

  return { formError, setFormError, isPending, submit }
}

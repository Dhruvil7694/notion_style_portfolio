"use client"

import { useCallback, useState } from "react"
import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { useAdminSaveToast } from "@/features/admin/components/admin-save-toast"
import type { ActionResult } from "@/features/admin/lib/schemas"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"

const DEFAULT_SUCCESS_MESSAGE = SAVE_MESSAGES.changes

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

type SubmitOptions = {
  successMessage?: string
  /** Skip the floating toast (e.g. when the caller shows a custom message). */
  silent?: boolean
}

export function useFormSubmission() {
  const saveToast = useAdminSaveToast()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const clearSuccess = useCallback(() => {
    saveToast?.dismissSaveSuccess()
  }, [saveToast])

  const notifySuccess = useCallback(
    (
      message: string = DEFAULT_SUCCESS_MESSAGE,
      options?: { silent?: boolean }
    ) => {
      if (!options?.silent) {
        saveToast?.showSaveSuccess(message)
      }
    },
    [saveToast]
  )

  async function submit<T = void>(
    action: () => Promise<ActionResult<T>>,
    options?: SubmitOptions
  ): Promise<ActionResult<T>> {
    setIsPending(true)
    setFormError(null)
    clearSuccess()

    try {
      const result = await action()

      if (!result?.success) {
        setFormError(result?.error ?? "Something went wrong. Try again.")
        return (
          result ?? {
            success: false,
            error: "Something went wrong. Try again.",
          }
        )
      }

      const message = options?.successMessage ?? DEFAULT_SUCCESS_MESSAGE
      notifySuccess(message, { silent: options?.silent })
      return result
    } finally {
      setIsPending(false)
    }
  }

  return {
    formError,
    setFormError,
    clearSuccess,
    notifySuccess,
    isPending,
    submit,
  }
}

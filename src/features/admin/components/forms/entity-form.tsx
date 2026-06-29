"use client"

import { cn } from "@/shared/lib/utils"

type EntityFormProps = {
  children: React.ReactNode
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  formError?: string | null
  className?: string
}

export function EntityForm({
  children,
  onSubmit,
  formError,
  className,
}: EntityFormProps) {
  return (
    <form
      className={cn("space-y-8 pb-8", className)}
      noValidate
      onSubmit={onSubmit}
    >
      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}
      {children}
    </form>
  )
}

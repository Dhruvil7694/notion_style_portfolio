"use client"

type EntityFormProps = {
  children: React.ReactNode
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  formError?: string | null
  formSuccess?: string | null
}

export function EntityForm({ children, onSubmit, formError, formSuccess }: EntityFormProps) {
  return (
    <form className="space-y-6" noValidate onSubmit={onSubmit}>
      {formSuccess ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
          {formSuccess}
        </p>
      ) : null}
      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}
      {children}
    </form>
  )
}

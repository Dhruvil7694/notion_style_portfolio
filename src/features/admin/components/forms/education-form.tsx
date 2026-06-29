"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import {
  DeleteDialog,
  EntityForm,
  FormField,
  SaveBar,
  TextArea,
  TextInput,
} from "@/features/admin/components/forms"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createEducation,
  deleteEducation,
  updateEducation,
} from "@/features/admin/lib/actions/education"
import {
  type EducationFormData,
  educationFormSchema,
  type EducationFormValues,
} from "@/features/admin/lib/schemas"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { Education } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

type EducationFormProps = {
  mode: "create" | "edit"
  education?: Education
  variant?: "page" | "panel"
  onSuccess?: () => void
  onCancel?: () => void
}

const routes = adminResourceRoutes.education

export function EducationForm({
  mode,
  education,
  variant = "page",
  onSuccess,
  onCancel,
}: EducationFormProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<EducationFormValues, unknown, EducationFormData>({
    resolver: zodResolver(educationFormSchema),
    defaultValues: {
      institution: education?.institution ?? "",
      degree: education?.degree ?? "",
      description: education?.description ?? "",
    },
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      const result = await submit(() => createEducation(values), {
        successMessage: SAVE_MESSAGES.education,
      })
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        return
      }

      if (variant === "panel") {
        onSuccess?.()
        return
      }

      if (result.data?.id) {
        router.push(routes.edit(result.data.id))
      }
      return
    }

    if (!education) {
      return
    }

    const result = await submit(() => updateEducation(education.id, values), {
      successMessage: SAVE_MESSAGES.education,
    })
    if (result.success) {
      router.refresh()
    } else {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  async function handleDelete() {
    if (!education) {
      return
    }

    setIsDeleting(true)
    await deleteEducation(education.id)
  }

  const formBody = (
    <EntityForm
      className={variant === "panel" ? "space-y-5 pb-0" : undefined}
      formError={formError}
      onSubmit={onSubmit}
    >
      <FormField
        error={errors.institution?.message}
        label="Institution"
        name="institution"
        required
      >
        <TextInput id="institution" {...register("institution")} />
      </FormField>

      <FormField
        error={errors.degree?.message}
        label="Degree"
        name="degree"
        required
      >
        <TextInput id="degree" {...register("degree")} />
      </FormField>

      <FormField
        error={errors.description?.message}
        label="Description"
        name="description"
      >
        <TextArea id="description" {...register("description")} />
      </FormField>

      {variant === "panel" ? (
        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel ? (
            <button
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          ) : null}
          <button
            className={cn(buttonVariants({ size: "sm" }))}
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Creating…" : "Create education"}
          </button>
        </div>
      ) : (
        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create education" : "Save changes"}
        />
      )}
    </EntityForm>
  )

  if (variant === "panel") {
    return formBody
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Add a degree or certification."
              : "Update education details."
          }
          title={
            mode === "create"
              ? "New education"
              : `${education?.degree ?? "Edit"} — ${education?.institution ?? ""}`
          }
        />
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href={routes.list}
        >
          Back to list
        </Link>
      </div>

      {formBody}

      <DeleteDialog
        description="This permanently removes the education entry."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete education?"
      />
    </div>
  )
}

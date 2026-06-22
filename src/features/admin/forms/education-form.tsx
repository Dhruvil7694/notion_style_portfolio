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
} from "@/components/admin/forms"
import { PageHeader } from "@/components/admin/page-header"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createEducation,
  deleteEducation,
  updateEducation,
} from "@/lib/admin/actions/education"
import {
  type EducationFormData,
  educationFormSchema,
  type EducationFormValues,
} from "@/lib/admin/schemas"
import { cn } from "@/lib/utils"
import type { Education } from "@/types/database.helpers"

type EducationFormProps = {
  mode: "create" | "edit"
  education?: Education
}

const routes = adminResourceRoutes.education

export function EducationForm({ mode, education }: EducationFormProps) {
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
      const result = await submit(() => createEducation(values))
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
      }
      return
    }

    if (!education) {
      return
    }

    const result = await submit(() => updateEducation(education.id, values))
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
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={routes.list}>
          Back to list
        </Link>
      </div>

      <EntityForm formError={formError} onSubmit={onSubmit}>
        <FormField error={errors.institution?.message} label="Institution" name="institution" required>
          <TextInput id="institution" {...register("institution")} />
        </FormField>

        <FormField error={errors.degree?.message} label="Degree" name="degree" required>
          <TextInput id="degree" {...register("degree")} />
        </FormField>

        <FormField error={errors.description?.message} label="Description" name="description">
          <TextArea id="description" {...register("description")} />
        </FormField>

        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create education" : "Save changes"}
        />
      </EntityForm>

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

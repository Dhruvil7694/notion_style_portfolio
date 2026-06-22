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
  createExperience,
  deleteExperience,
  updateExperience,
} from "@/lib/admin/actions/experience"
import {
  commaListToText,
  type ExperienceFormData,
  experienceFormSchema,
  type ExperienceFormValues,
  linesToText,
} from "@/lib/admin/schemas"
import { cn } from "@/lib/utils"
import type { Experience } from "@/types/database.helpers"

type ExperienceFormProps = {
  mode: "create" | "edit"
  experience?: Experience
}

const routes = adminResourceRoutes.experience

export function ExperienceForm({ mode, experience }: ExperienceFormProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<ExperienceFormValues, unknown, ExperienceFormData>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      company: experience?.company ?? "",
      role: experience?.role ?? "",
      location: experience?.location ?? "",
      start_date: experience?.start_date ?? "",
      end_date: experience?.end_date ?? "",
      description: experience?.description ?? "",
      achievements: linesToText(experience?.achievements),
      tech_stack: commaListToText(experience?.tech_stack),
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
      const result = await submit(() => createExperience(values))
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
      }
      return
    }

    if (!experience) {
      return
    }

    const result = await submit(() => updateExperience(experience.id, values))
    if (result.success) {
      router.refresh()
    } else {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  async function handleDelete() {
    if (!experience) {
      return
    }

    setIsDeleting(true)
    await deleteExperience(experience.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Add a new role to your experience timeline."
              : "Update role details and timeline."
          }
          title={
            mode === "create"
              ? "New experience"
              : `${experience?.role ?? "Edit"} at ${experience?.company ?? ""}`
          }
        />
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={routes.list}>
          Back to list
        </Link>
      </div>

      <EntityForm formError={formError} onSubmit={onSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <FormField error={errors.company?.message} label="Company" name="company" required>
            <TextInput id="company" {...register("company")} />
          </FormField>
          <FormField error={errors.role?.message} label="Role" name="role" required>
            <TextInput id="role" {...register("role")} />
          </FormField>
        </div>

        <FormField error={errors.location?.message} label="Location" name="location">
          <TextInput id="location" {...register("location")} />
        </FormField>

        <div className="grid gap-6 lg:grid-cols-2">
          <FormField error={errors.start_date?.message} label="Start date" name="start_date" required>
            <TextInput id="start_date" type="date" {...register("start_date")} />
          </FormField>
          <FormField error={errors.end_date?.message} hint="Leave empty if current." label="End date" name="end_date">
            <TextInput id="end_date" type="date" {...register("end_date")} />
          </FormField>
        </div>

        <FormField error={errors.description?.message} label="Description" name="description">
          <TextArea id="description" {...register("description")} />
        </FormField>

        <FormField
          error={errors.achievements?.message}
          hint="One achievement per line."
          label="Achievements"
          name="achievements"
        >
          <TextArea id="achievements" {...register("achievements")} />
        </FormField>

        <FormField
          error={errors.tech_stack?.message}
          hint="Comma-separated technologies used in this role."
          label="Tech stack"
          name="tech_stack"
        >
          <TextInput id="tech_stack" {...register("tech_stack")} />
        </FormField>

        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create experience" : "Save changes"}
        />
      </EntityForm>

      <DeleteDialog
        description="This permanently removes the experience entry."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete experience?"
      />
    </div>
  )
}

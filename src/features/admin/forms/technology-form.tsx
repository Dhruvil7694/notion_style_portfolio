"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"

import {
  DeleteDialog,
  EntityForm,
  FormField,
  FormSection,
  SaveBar,
  StatusSelector,
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
  createTechnologyEntry,
  deleteTechnologyEntry,
  updateTechnologyEntry,
} from "@/lib/admin/actions/technologies"
import {
  type TechnologyFormData,
  technologyFormSchema,
  type TechnologyFormValues,
} from "@/lib/admin/schemas"
import { cn } from "@/lib/utils"
import type { TechnologyRegistry } from "@/types/database.helpers"

type TechnologyFormProps = {
  mode: "create" | "edit"
  entry?: TechnologyRegistry
}

const routes = adminResourceRoutes.technologies

export function TechnologyForm({ mode, entry }: TechnologyFormProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<TechnologyFormValues, unknown, TechnologyFormData>({
    resolver: zodResolver(technologyFormSchema),
    defaultValues: {
      title: entry?.title ?? "",
      slug: entry?.slug ?? "",
      description: entry?.description ?? "",
      summary: entry?.summary ?? "",
      category: entry?.category ?? "",
      website_url: entry?.website_url ?? "",
      documentation_url: entry?.documentation_url ?? "",
      featured: entry?.featured ?? false,
      display_order: entry?.display_order ?? 0,
      status: entry?.status === "published" ? "published" : "draft",
    },
  })

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      const result = await submit(() => createTechnologyEntry(values))
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
      }
      return
    }

    if (!entry) {
      return
    }

    const result = await submit(() => updateTechnologyEntry(entry.id, values))
    if (!result.success) {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  async function handleDelete() {
    if (!entry) {
      return
    }

    setIsDeleting(true)
    await deleteTechnologyEntry(entry.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description="Technology knowledge hubs with documentation links."
          title={mode === "create" ? "New technology" : (entry?.title ?? "Edit technology")}
        />
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={routes.list}>
          Back to list
        </Link>
      </div>

      <EntityForm formError={formError} onSubmit={onSubmit}>
        <FormSection title="Basics">
          <FormField error={errors.title?.message} label="Title" name="title" required>
            <TextInput id="title" {...register("title")} />
          </FormField>
          <FormField error={errors.slug?.message} label="Slug" name="slug" required>
            <TextInput id="slug" {...register("slug")} />
          </FormField>
          <FormField error={errors.category?.message} label="Category" name="category">
            <TextInput id="category" {...register("category")} placeholder="Orchestration, Backend" />
          </FormField>
          <FormField error={errors.summary?.message} label="Summary" name="summary">
            <TextArea id="summary" {...register("summary")} rows={3} />
          </FormField>
          <FormField error={errors.description?.message} label="Description" name="description">
            <TextArea id="description" {...register("description")} rows={4} />
          </FormField>
          <FormField error={errors.website_url?.message} label="Website URL" name="website_url">
            <TextInput id="website_url" {...register("website_url")} />
          </FormField>
          <FormField
            error={errors.documentation_url?.message}
            label="Documentation URL"
            name="documentation_url"
          >
            <TextInput id="documentation_url" {...register("documentation_url")} />
          </FormField>
          <StatusSelector
            error={errors.status?.message}
            onChange={(value) => setValue("status", value, { shouldValidate: true })}
            value={watch("status")}
          />
        </FormSection>

        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create technology" : "Save changes"}
        />
      </EntityForm>

      <DeleteDialog
        description="This technology hub will be removed from the registry."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete technology?"
      />
    </div>
  )
}

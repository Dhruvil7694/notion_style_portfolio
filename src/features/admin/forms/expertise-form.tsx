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
import { BulletListField } from "@/features/admin/forms/bullet-list-field"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createExpertiseArea,
  deleteExpertiseArea,
  updateExpertiseArea,
} from "@/lib/admin/actions/expertise"
import {
  commaListToText,
  type ExpertiseFormData,
  expertiseFormSchema,
  type ExpertiseFormValues,
} from "@/lib/admin/schemas"
import { cn } from "@/lib/utils"
import type { ExpertiseArea } from "@/types/database.helpers"

type ExpertiseFormProps = {
  mode: "create" | "edit"
  area?: ExpertiseArea
}

const routes = adminResourceRoutes.expertise

export function ExpertiseForm({ mode, area }: ExpertiseFormProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<ExpertiseFormValues, unknown, ExpertiseFormData>({
    resolver: zodResolver(expertiseFormSchema),
    defaultValues: {
      title: area?.title ?? "",
      slug: area?.slug ?? "",
      description: area?.description ?? "",
      summary: area?.summary ?? "",
      why_it_matters: area?.why_it_matters ?? "",
      key_takeaways: area?.key_takeaways ?? [],
      keywords: commaListToText(area?.keywords),
      related_expertise_slugs: commaListToText(area?.related_expertise_slugs),
      icon_name: area?.icon_name ?? "",
      featured: area?.featured ?? false,
      display_order: area?.display_order ?? 0,
      status: area?.status === "published" ? "published" : "draft",
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

  const watched = watch()

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      const result = await submit(() => createExpertiseArea(values))
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
      }
      return
    }

    if (!area) {
      return
    }

    const result = await submit(() => updateExpertiseArea(area.id, values))
    if (!result.success) {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  async function handleDelete() {
    if (!area) {
      return
    }

    setIsDeleting(true)
    await deleteExpertiseArea(area.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description="Authority pages for the knowledge graph."
          title={mode === "create" ? "New expertise area" : (area?.title ?? "Edit expertise")}
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
          <FormField error={errors.summary?.message} label="Summary" name="summary">
            <TextArea id="summary" {...register("summary")} rows={3} />
          </FormField>
          <FormField error={errors.description?.message} label="Description" name="description">
            <TextArea id="description" {...register("description")} rows={4} />
          </FormField>
          <FormField
            error={errors.why_it_matters?.message}
            label="Why it matters"
            name="why_it_matters"
          >
            <TextArea id="why_it_matters" {...register("why_it_matters")} rows={4} />
          </FormField>
          <FormField error={errors.keywords?.message} label="Keywords" name="keywords">
            <TextInput
              id="keywords"
              {...register("keywords")}
              placeholder="RAG, Retrieval, Hybrid Search"
            />
          </FormField>
          <FormField
            error={errors.related_expertise_slugs?.message}
            label="Related expertise slugs"
            name="related_expertise_slugs"
          >
            <TextInput
              id="related_expertise_slugs"
              {...register("related_expertise_slugs")}
              placeholder="vector-search, document-intelligence"
            />
          </FormField>
          <FormField
            error={errors.key_takeaways?.message}
            label="Key takeaways"
            name="key_takeaways"
          >
            <BulletListField
              addLabel="Add takeaway"
              onChange={(value) =>
                setValue("key_takeaways", value, { shouldDirty: true, shouldValidate: true })
              }
              value={watched.key_takeaways ?? []}
            />
          </FormField>
          <StatusSelector
            error={errors.status?.message}
            onChange={(value) => setValue("status", value, { shouldValidate: true })}
            value={watched.status}
          />
        </FormSection>

        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create expertise area" : "Save changes"}
        />
      </EntityForm>

      <DeleteDialog
        description="This expertise area will be removed from the knowledge graph."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete expertise area?"
      />
    </div>
  )
}

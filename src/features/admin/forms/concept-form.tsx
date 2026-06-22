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
  createConceptEntry,
  deleteConceptEntry,
  updateConceptEntry,
} from "@/lib/admin/actions/concepts"
import {
  commaListToText,
  type ConceptFormData,
  conceptFormSchema,
  type ConceptFormValues,
} from "@/lib/admin/schemas"
import { cn } from "@/lib/utils"
import type { ConceptRegistry } from "@/types/database.helpers"

type ConceptFormProps = {
  mode: "create" | "edit"
  entry?: ConceptRegistry
}

const routes = adminResourceRoutes.concepts

export function ConceptForm({ mode, entry }: ConceptFormProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<ConceptFormValues, unknown, ConceptFormData>({
    resolver: zodResolver(conceptFormSchema),
    defaultValues: {
      title: entry?.title ?? "",
      slug: entry?.slug ?? "",
      description: entry?.description ?? "",
      summary: entry?.summary ?? "",
      why_it_matters: entry?.why_it_matters ?? "",
      related_concept_slugs: commaListToText(entry?.related_concept_slugs),
      related_expertise_slugs: commaListToText(entry?.related_expertise_slugs),
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
      const result = await submit(() => createConceptEntry(values))
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
      }
      return
    }

    if (!entry) {
      return
    }

    const result = await submit(() => updateConceptEntry(entry.id, values))
    if (!result.success) {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  async function handleDelete() {
    if (!entry) {
      return
    }

    setIsDeleting(true)
    await deleteConceptEntry(entry.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description="Concept authority pages for GEO retrieval."
          title={mode === "create" ? "New concept" : (entry?.title ?? "Edit concept")}
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
          <FormField
            error={errors.related_concept_slugs?.message}
            label="Related concept slugs"
            name="related_concept_slugs"
          >
            <TextInput
              id="related_concept_slugs"
              {...register("related_concept_slugs")}
              placeholder="citation-validation, agent-memory"
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
              placeholder="rag-systems, vector-search"
            />
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
          submitLabel={mode === "create" ? "Create concept" : "Save changes"}
        />
      </EntityForm>

      <DeleteDialog
        description="This concept authority page will be removed."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete concept?"
      />
    </div>
  )
}

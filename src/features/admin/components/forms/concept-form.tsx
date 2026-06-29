"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import {
  DeleteDialog,
  EntityForm,
  FormField,
  FormSection,
  StatusSelector,
  TextArea,
  TextInput,
} from "@/features/admin/components/forms"
import { CONCEPT_FORM_STEPS } from "@/features/admin/components/forms/concept-form-steps"
import {
  createWizardSaveAction,
  EntityFormWizardFooter,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createConceptEntry,
  deleteConceptEntry,
  updateConceptEntry,
} from "@/features/admin/lib/actions/concepts"
import {
  commaListToText,
  type ConceptFormData,
  conceptFormSchema,
  type ConceptFormValues,
} from "@/features/admin/lib/schemas"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { ConceptRegistry } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

type ConceptFormProps = {
  mode: "create" | "edit"
  entry?: ConceptRegistry
  variant?: "page" | "panel"
  onSuccess?: () => void
  onCancel?: () => void
}

const routes = adminResourceRoutes.concepts

export function ConceptForm({
  mode,
  entry,
  variant = "page",
  onSuccess,
  onCancel,
}: ConceptFormProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, setFormError, submit } = useFormSubmission()

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
    trigger,
    formState: { errors },
  } = form

  const watched = watch()

  const {
    currentStep,
    maxReachedStep,
    goToStep,
    handleNextStep,
    handlePreviousStep,
    handleInvalidSubmit,
  } = useEntityFormWizard({
    steps: CONCEPT_FORM_STEPS,
    mode,
    trigger,
    setFormError,
  })

  const saveConcept = useCallback(
    async (values: ConceptFormData) => {
      if (mode === "create") {
        const result = await submit(() => createConceptEntry(values), {
          successMessage: SAVE_MESSAGES.concept,
        })
        if (!result.success) {
          applyServerFieldErrors(setError, result.fieldErrors)
          throw new Error("Create failed")
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

      if (!entry) {
        throw new Error("Concept not found")
      }

      const result = await submit(() => updateConceptEntry(entry.id, values), {
        successMessage: SAVE_MESSAGES.concept,
      })
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }
    },
    [entry, mode, onSuccess, router, setError, submit, variant]
  )

  const onSubmit = handleSubmit(saveConcept, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveConcept, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveConcept]
  )

  async function handleDelete() {
    if (!entry) {
      return
    }

    setIsDeleting(true)
    await deleteConceptEntry(entry.id)
  }

  const pageTitle =
    mode === "create" ? "New concept" : (entry?.title ?? "Edit concept")

  const formBody = (
    <EntityForm
      className={variant === "panel" ? "space-y-4 pb-0" : undefined}
      formError={formError}
      onSubmit={onSubmit}
    >
      <EntityFormWizardNav
        actions={{
          isDeleting,
          isSubmitting: isPending,
          onBack: handlePreviousStep,
          onNext: handleNextStep,
          onSave,
          submitLabel: mode === "create" ? "Create concept" : "Save changes",
        }}
        className={variant === "panel" ? "mb-4 p-4" : undefined}
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepChange={goToStep}
        steps={CONCEPT_FORM_STEPS}
      />

      {currentStep === 0 ? (
        <div className="space-y-5">
          <FormSection
            description="Title, slug, summary, and description."
            title="Identity"
            variant="card"
          >
            <FormField
              error={errors.title?.message}
              label="Title"
              name="title"
              required
            >
              <TextInput id="title" {...register("title")} />
            </FormField>
            <FormField
              error={errors.slug?.message}
              label="Slug"
              name="slug"
              required
            >
              <TextInput id="slug" {...register("slug")} />
            </FormField>
            <FormField
              error={errors.summary?.message}
              label="Summary"
              name="summary"
            >
              <TextArea id="summary" {...register("summary")} rows={3} />
            </FormField>
            <FormField
              error={errors.description?.message}
              label="Description"
              name="description"
            >
              <TextArea
                id="description"
                {...register("description")}
                rows={4}
              />
            </FormField>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <FormSection
            description="Why it matters and links to related concepts and expertise."
            title="Relationships"
            variant="card"
          >
            <FormField
              error={errors.why_it_matters?.message}
              label="Why it matters"
              name="why_it_matters"
            >
              <TextArea
                id="why_it_matters"
                {...register("why_it_matters")}
                rows={4}
              />
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
          </FormSection>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-5">
          <FormSection
            description="Featured flag, display order, and publishing status."
            title="Publish"
            variant="card"
          >
            <FormField label="Featured" name="featured">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("featured")} />
                Show on featured sections
              </label>
            </FormField>
            <FormField
              error={errors.display_order?.message}
              hint="Lower numbers appear first."
              label="Display order"
              name="display_order"
            >
              <TextInput
                id="display_order"
                min={0}
                type="number"
                {...register("display_order")}
              />
            </FormField>
            <StatusSelector
              error={errors.status?.message}
              onChange={(value) =>
                setValue("status", value, { shouldValidate: true })
              }
              value={watched.status}
            />
          </FormSection>
        </div>
      ) : null}

      <EntityFormWizardFooter
        isDeleting={isDeleting}
        isSubmitting={isPending}
        onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
      />

      {variant === "panel" && onCancel ? (
        <div className="flex justify-end pt-2">
          <button
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </EntityForm>
  )

  if (variant === "panel") {
    return formBody
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description="Concept authority pages for GEO retrieval."
          title={pageTitle}
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

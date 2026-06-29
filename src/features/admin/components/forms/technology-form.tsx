"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
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
  UrlInput,
} from "@/features/admin/components/forms"
import {
  createWizardSaveAction,
  EntityFormWizardFooter,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { TECHNOLOGY_FORM_STEPS } from "@/features/admin/components/forms/technology-form-steps"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createTechnologyEntry,
  deleteTechnologyEntry,
  updateTechnologyEntry,
} from "@/features/admin/lib/actions/technologies"
import {
  type TechnologyFormData,
  technologyFormSchema,
  type TechnologyFormValues,
} from "@/features/admin/lib/schemas"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { TechnologyRegistry } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

type TechnologyFormProps = {
  mode: "create" | "edit"
  entry?: TechnologyRegistry
}

const routes = adminResourceRoutes.technologies

export function TechnologyForm({ mode, entry }: TechnologyFormProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, setFormError, submit } = useFormSubmission()

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
    steps: TECHNOLOGY_FORM_STEPS,
    mode,
    trigger,
    setFormError,
  })

  const saveTechnology = useCallback(
    async (values: TechnologyFormData) => {
      if (mode === "create") {
        const result = await submit(() => createTechnologyEntry(values), {
          successMessage: SAVE_MESSAGES.technology,
        })
        if (!result.success) {
          applyServerFieldErrors(setError, result.fieldErrors)
          throw new Error("Create failed")
        }
        return
      }

      if (!entry) {
        throw new Error("Technology not found")
      }

      const result = await submit(
        () => updateTechnologyEntry(entry.id, values),
        {
          successMessage: SAVE_MESSAGES.technology,
        }
      )
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }
    },
    [entry, mode, setError, submit]
  )

  const onSubmit = handleSubmit(saveTechnology, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveTechnology, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveTechnology]
  )

  async function handleDelete() {
    if (!entry) {
      return
    }

    setIsDeleting(true)
    await deleteTechnologyEntry(entry.id)
  }

  const pageTitle =
    mode === "create" ? "New technology" : (entry?.title ?? "Edit technology")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description="Technology knowledge hubs with documentation links."
          title={pageTitle}
        />
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href={routes.list}
        >
          Back to list
        </Link>
      </div>

      <EntityForm formError={formError} onSubmit={onSubmit}>
        <EntityFormWizardNav
          actions={{
            isDeleting,
            isSubmitting: isPending,
            onBack: handlePreviousStep,
            onNext: handleNextStep,
            onSave,
            submitLabel:
              mode === "create" ? "Create technology" : "Save changes",
          }}
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepChange={goToStep}
          steps={TECHNOLOGY_FORM_STEPS}
        />

        {currentStep === 0 ? (
          <div className="space-y-5">
            <FormSection
              description="Title, slug, category, and summary."
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
                error={errors.category?.message}
                label="Category"
                name="category"
              >
                <TextInput
                  id="category"
                  {...register("category")}
                  placeholder="Orchestration, Backend"
                />
              </FormField>
              <FormField
                error={errors.summary?.message}
                label="Summary"
                name="summary"
              >
                <TextArea id="summary" {...register("summary")} rows={3} />
              </FormField>
            </FormSection>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="space-y-5">
            <FormSection
              description="Full description and external documentation links."
              title="Content"
              variant="card"
            >
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
              <FormField
                error={errors.website_url?.message}
                label="Website URL"
                name="website_url"
              >
                <UrlInput id="website_url" {...register("website_url")} />
              </FormField>
              <FormField
                error={errors.documentation_url?.message}
                label="Documentation URL"
                name="documentation_url"
              >
                <UrlInput
                  id="documentation_url"
                  {...register("documentation_url")}
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

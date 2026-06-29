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
} from "@/features/admin/components/forms"
import { BulletListField } from "@/features/admin/components/forms/bullet-list-field"
import {
  createWizardSaveAction,
  EntityFormWizardFooter,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { EXPERTISE_FORM_STEPS } from "@/features/admin/components/forms/expertise-form-steps"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createExpertiseArea,
  deleteExpertiseArea,
  updateExpertiseArea,
} from "@/features/admin/lib/actions/expertise"
import {
  commaListToText,
  type ExpertiseFormData,
  expertiseFormSchema,
  type ExpertiseFormValues,
} from "@/features/admin/lib/schemas"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { ExpertiseArea } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

type ExpertiseFormProps = {
  mode: "create" | "edit"
  area?: ExpertiseArea
}

const routes = adminResourceRoutes.expertise

export function ExpertiseForm({ mode, area }: ExpertiseFormProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, setFormError, submit } = useFormSubmission()

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
    steps: EXPERTISE_FORM_STEPS,
    mode,
    trigger,
    setFormError,
  })

  const saveExpertise = useCallback(
    async (values: ExpertiseFormData) => {
      if (mode === "create") {
        const result = await submit(() => createExpertiseArea(values), {
          successMessage: SAVE_MESSAGES.expertise,
        })
        if (!result.success) {
          applyServerFieldErrors(setError, result.fieldErrors)
          throw new Error("Create failed")
        }
        return
      }

      if (!area) {
        throw new Error("Expertise area not found")
      }

      const result = await submit(() => updateExpertiseArea(area.id, values), {
        successMessage: SAVE_MESSAGES.expertise,
      })
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }
    },
    [area, mode, setError, submit]
  )

  const onSubmit = handleSubmit(saveExpertise, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveExpertise, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveExpertise]
  )

  async function handleDelete() {
    if (!area) {
      return
    }

    setIsDeleting(true)
    await deleteExpertiseArea(area.id)
  }

  const pageTitle =
    mode === "create" ? "New expertise area" : (area?.title ?? "Edit expertise")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description="Authority pages for the knowledge graph."
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
              mode === "create" ? "Create expertise area" : "Save changes",
          }}
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepChange={goToStep}
          steps={EXPERTISE_FORM_STEPS}
        />

        {currentStep === 0 ? (
          <div className="space-y-5">
            <FormSection
              description="Title, slug, summary, and long-form description."
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
              description="Why it matters, keywords, related areas, and takeaways."
              title="Context"
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
                error={errors.keywords?.message}
                label="Keywords"
                name="keywords"
              >
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
                    setValue("key_takeaways", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  value={watched.key_takeaways ?? []}
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

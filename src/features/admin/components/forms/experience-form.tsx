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
  TextArea,
  TextInput,
} from "@/features/admin/components/forms"
import { AchievementsField } from "@/features/admin/components/forms/achievements-field"
import {
  createWizardSaveAction,
  EntityFormWizardFooter,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { EXPERIENCE_FORM_STEPS } from "@/features/admin/components/forms/experience-form-steps"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { achievementsToDocument } from "@/features/admin/lib/achievements-serializer"
import {
  createExperience,
  deleteExperience,
  updateExperience,
} from "@/features/admin/lib/actions/experience"
import {
  commaListToText,
  type ExperienceFormData,
  experienceFormSchema,
  type ExperienceFormValues,
} from "@/features/admin/lib/schemas"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { Experience } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

type ExperienceFormProps = {
  mode: "create" | "edit"
  experience?: Experience
}

const routes = adminResourceRoutes.experience

export function ExperienceForm({ mode, experience }: ExperienceFormProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, setFormError, submit } = useFormSubmission()

  const form = useForm<ExperienceFormValues, unknown, ExperienceFormData>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      company: experience?.company ?? "",
      role: experience?.role ?? "",
      location: experience?.location ?? "",
      start_date: experience?.start_date ?? "",
      end_date: experience?.end_date ?? "",
      description: experience?.description ?? "",
      achievements: achievementsToDocument(experience?.achievements),
      tech_stack: commaListToText(experience?.tech_stack),
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
    steps: EXPERIENCE_FORM_STEPS,
    mode,
    trigger,
    setFormError,
  })

  const saveExperience = useCallback(
    async (values: ExperienceFormData) => {
      if (mode === "create") {
        const result = await submit(() => createExperience(values), {
          successMessage: SAVE_MESSAGES.experience,
        })
        if (!result.success) {
          applyServerFieldErrors(setError, result.fieldErrors)
          throw new Error("Create failed")
        }
        return
      }

      if (!experience) {
        throw new Error("Experience not found")
      }

      const result = await submit(
        () => updateExperience(experience.id, values),
        {
          successMessage: SAVE_MESSAGES.experience,
        }
      )
      if (result.success) {
        router.refresh()
        return
      }

      applyServerFieldErrors(setError, result.fieldErrors)
      throw new Error("Save failed")
    },
    [experience, mode, router, setError, submit]
  )

  const onSubmit = handleSubmit(saveExperience, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveExperience, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveExperience]
  )

  async function handleDelete() {
    if (!experience) {
      return
    }

    setIsDeleting(true)
    await deleteExperience(experience.id)
  }

  const pageTitle =
    mode === "create"
      ? "New experience"
      : `${experience?.role ?? "Edit"} at ${experience?.company ?? ""}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Add a new role to your experience timeline."
              : "Update role details and timeline."
          }
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
              mode === "create" ? "Create experience" : "Save changes",
          }}
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepChange={goToStep}
          steps={EXPERIENCE_FORM_STEPS}
        />

        {currentStep === 0 ? (
          <div className="space-y-5">
            <FormSection
              description="Company, role, location, and employment dates."
              title="Role"
              variant="card"
            >
              <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
                <FormField
                  error={errors.company?.message}
                  label="Company"
                  name="company"
                  required
                >
                  <TextInput id="company" {...register("company")} />
                </FormField>
                <FormField
                  error={errors.role?.message}
                  label="Role"
                  name="role"
                  required
                >
                  <TextInput id="role" {...register("role")} />
                </FormField>
              </div>

              <FormField
                error={errors.location?.message}
                label="Location"
                name="location"
              >
                <TextInput id="location" {...register("location")} />
              </FormField>

              <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
                <FormField
                  error={errors.start_date?.message}
                  label="Start date"
                  name="start_date"
                  required
                >
                  <TextInput
                    id="start_date"
                    type="date"
                    {...register("start_date")}
                  />
                </FormField>
                <FormField
                  error={errors.end_date?.message}
                  hint="Leave empty if current."
                  label="End date"
                  name="end_date"
                >
                  <TextInput
                    id="end_date"
                    type="date"
                    {...register("end_date")}
                  />
                </FormField>
              </div>
            </FormSection>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="space-y-5">
            <FormSection
              description="Role summary, achievements, and technologies used."
              title="Details"
              variant="card"
            >
              <FormField
                error={errors.description?.message}
                label="Description"
                name="description"
              >
                <TextArea id="description" {...register("description")} />
              </FormField>

              <AchievementsField
                error={errors.achievements?.message}
                onChange={(document) =>
                  setValue("achievements", document, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                value={watched.achievements}
              />

              <FormField
                error={errors.tech_stack?.message}
                hint="Comma-separated technologies used in this role."
                label="Tech stack"
                name="tech_stack"
              >
                <TextInput id="tech_stack" {...register("tech_stack")} />
              </FormField>
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

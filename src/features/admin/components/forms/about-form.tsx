"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"

import type { AboutContent } from "@/features/about/lib/about-content"
import {
  AvatarImageField,
  EntityForm,
  FormField,
  FormSection,
  TextArea,
  TextInput,
} from "@/features/admin/components/forms"
import { ABOUT_FORM_STEPS } from "@/features/admin/components/forms/about-form-steps"
import {
  createWizardSaveAction,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { updateAbout } from "@/features/admin/lib/actions/settings"
import {
  type AboutPageFormData,
  aboutPageFormSchema,
  type AboutPageFormValues,
  toAboutFormValues,
} from "@/features/admin/lib/schemas"
import type { SiteSettings } from "@/features/portfolio/lib/settings"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"

type AboutFormProps = {
  site: SiteSettings
  about: AboutContent
}

export function AboutForm({ site, about }: AboutFormProps) {
  const { formError, isPending, setFormError, submit } = useFormSubmission()

  const form = useForm<AboutPageFormValues, unknown, AboutPageFormData>({
    resolver: zodResolver(aboutPageFormSchema),
    defaultValues: toAboutFormValues({ site, about }),
  })

  const {
    control,
    register,
    handleSubmit,
    setError,
    trigger,
    formState: { errors },
  } = form

  const {
    currentStep,
    maxReachedStep,
    goToStep,
    handleNextStep,
    handlePreviousStep,
    handleInvalidSubmit,
  } = useEntityFormWizard({
    steps: ABOUT_FORM_STEPS,
    mode: "edit",
    trigger: (fields) => trigger(fields as Parameters<typeof trigger>[0]),
    setFormError,
  })

  const saveAbout = useCallback(
    async (values: AboutPageFormData) => {
      const result = await submit(() => updateAbout(values), {
        successMessage: SAVE_MESSAGES.about,
      })
      if (result && !result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }
    },
    [setError, submit]
  )

  const onSubmit = handleSubmit(saveAbout, handleInvalidSubmit)
  const onSave = useMemo(
    () => createWizardSaveAction(handleSubmit, saveAbout, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveAbout]
  )

  return (
    <EntityForm formError={formError} onSubmit={onSubmit}>
      <EntityFormWizardNav
        actions={{
          isSubmitting: isPending,
          onBack: handlePreviousStep,
          onNext: handleNextStep,
          onSave,
          submitLabel: "Save about page",
        }}
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepChange={goToStep}
        steps={ABOUT_FORM_STEPS}
      />

      {currentStep === 0 ? (
        <div className="space-y-5">
          <FormSection
            description="Photo and opening copy visitors see first on the About page."
            title="Photo & opening"
            variant="card"
          >
            <Controller
              control={control}
              name="owner_avatar_about"
              render={({ field }) => (
                <AvatarImageField
                  error={errors.owner_avatar_about?.message}
                  onChange={field.onChange}
                  value={field.value ?? ""}
                  variant="about"
                />
              )}
            />

            <FormField error={errors.intro?.message} label="Intro" name="intro">
              <TextArea rows={3} {...register("intro")} />
            </FormField>

            <FormField
              error={errors.intro_tools?.message}
              label="Intro tools line"
              name="intro_tools"
            >
              <TextArea rows={2} {...register("intro_tools")} />
            </FormField>

            <FormField
              error={errors.career_intro?.message}
              label="Career intro"
              name="career_intro"
            >
              <TextArea rows={2} {...register("career_intro")} />
            </FormField>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <FormSection
            description="Core narrative sections — each maps to a paragraph on the public About page."
            title="Story sections"
            variant="card"
          >
            <FormField
              error={errors.after_umbrella?.message}
              label="After umbrella paragraph"
              name="after_umbrella"
            >
              <TextArea rows={3} {...register("after_umbrella")} />
            </FormField>

            <FormField
              error={errors.retrieval?.message}
              label="Retrieval paragraph"
              name="retrieval"
            >
              <TextArea rows={3} {...register("retrieval")} />
            </FormField>

            <FormField
              error={errors.ownership?.message}
              label="Ownership paragraph"
              name="ownership"
            >
              <TextArea rows={3} {...register("ownership")} />
            </FormField>

            <FormField
              error={errors.outside?.message}
              label="Outside work paragraph"
              name="outside"
            >
              <TextArea rows={3} {...register("outside")} />
            </FormField>

            <FormField
              error={errors.mcp?.message}
              label="MCP paragraph"
              name="mcp"
            >
              <TextArea rows={3} {...register("mcp")} />
            </FormField>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-5">
          <FormSection
            description="Discovery metadata shown on the About page and homepage."
            title="Tags & keywords"
            variant="card"
          >
            <FormField
              error={errors.tags?.message}
              hint="Comma-separated tags shown at the bottom of the About page."
              label="About tags"
              name="tags"
            >
              <TextInput {...register("tags")} />
            </FormField>

            <FormField
              error={errors.flip_keywords?.message}
              hint="Comma-separated keywords for the animated tool list on the homepage."
              label="Homepage flip keywords"
              name="flip_keywords"
            >
              <TextInput {...register("flip_keywords")} />
            </FormField>
          </FormSection>
        </div>
      ) : null}
    </EntityForm>
  )
}

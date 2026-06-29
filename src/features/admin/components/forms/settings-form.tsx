"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"

import {
  EntityForm,
  FormField,
  FormSection,
  TextInput,
  UrlInput,
} from "@/features/admin/components/forms"
import {
  createWizardSaveAction,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { SETTINGS_FORM_STEPS } from "@/features/admin/components/forms/settings-form-steps"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { updateSettings } from "@/features/admin/lib/actions/settings"
import {
  type SettingsFormData,
  settingsFormSchema,
  type SettingsFormValues,
  toSettingsFormValues,
} from "@/features/admin/lib/schemas"
import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"

type SettingsFormProps = {
  settings: PublicSettings
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const { formError, isPending, setFormError, submit } = useFormSubmission()

  const form = useForm<SettingsFormValues, unknown, SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toSettingsFormValues(settings),
  })

  const {
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
    steps: SETTINGS_FORM_STEPS,
    mode: "edit",
    trigger: (fields) => trigger(fields as Parameters<typeof trigger>[0]),
    setFormError,
  })

  const saveSettings = useCallback(
    async (values: SettingsFormData) => {
      const result = await submit(() => updateSettings(values), {
        successMessage: SAVE_MESSAGES.settings,
      })
      if (result && !result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }
    },
    [setError, submit]
  )

  const onSubmit = handleSubmit(saveSettings, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveSettings, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveSettings]
  )

  return (
    <EntityForm formError={formError} onSubmit={onSubmit}>
      <EntityFormWizardNav
        actions={{
          isSubmitting: isPending,
          onBack: handlePreviousStep,
          onNext: handleNextStep,
          onSave,
          submitLabel: "Save settings",
        }}
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepChange={goToStep}
        steps={SETTINGS_FORM_STEPS}
      />

      {currentStep === 0 ? (
        <div className="space-y-5">
          <FormSection
            description="GitHub, LinkedIn, X, Substack, Medium, and Dev.to."
            title="Primary links"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              <FormField
                error={errors.social?.github?.message}
                label="GitHub"
                name="social.github"
              >
                <UrlInput {...register("social.github")} />
              </FormField>

              <FormField
                error={errors.social?.linkedin?.message}
                label="LinkedIn"
                name="social.linkedin"
              >
                <UrlInput {...register("social.linkedin")} />
              </FormField>

              <FormField
                error={errors.social?.twitter?.message}
                label="X / Twitter"
                name="social.twitter"
              >
                <UrlInput {...register("social.twitter")} />
              </FormField>

              <FormField
                error={errors.social?.substack?.message}
                label="Substack"
                name="social.substack"
              >
                <UrlInput {...register("social.substack")} />
              </FormField>

              <FormField
                error={errors.social?.medium?.message}
                label="Medium"
                name="social.medium"
              >
                <UrlInput {...register("social.medium")} />
              </FormField>

              <FormField
                error={errors.social?.devto?.message}
                label="Dev.to"
                name="social.devto"
              >
                <UrlInput {...register("social.devto")} />
              </FormField>
            </div>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <FormSection
            description="Discord, YouTube, Bluesky, Threads, and Instagram."
            title="Other platforms"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              <FormField
                error={errors.social?.discord?.message}
                label="Discord"
                name="social.discord"
              >
                <UrlInput {...register("social.discord")} />
              </FormField>

              <FormField
                error={errors.social?.youtube?.message}
                label="YouTube"
                name="social.youtube"
              >
                <UrlInput {...register("social.youtube")} />
              </FormField>

              <FormField
                error={errors.social?.bluesky?.message}
                label="Bluesky"
                name="social.bluesky"
              >
                <UrlInput {...register("social.bluesky")} />
              </FormField>

              <FormField
                error={errors.social?.threads?.message}
                label="Threads"
                name="social.threads"
              >
                <UrlInput {...register("social.threads")} />
              </FormField>

              <FormField
                error={errors.social?.instagram?.message}
                label="Instagram"
                name="social.instagram"
              >
                <UrlInput {...register("social.instagram")} />
              </FormField>
            </div>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-5">
          <FormSection
            description="Contact details and canonical site URL."
            title="Contact & site"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              <FormField
                error={errors.contact?.email?.message}
                label="Email"
                name="contact.email"
              >
                <TextInput type="email" {...register("contact.email")} />
              </FormField>

              <FormField
                error={errors.contact?.location?.message}
                label="Location"
                name="contact.location"
              >
                <TextInput {...register("contact.location")} />
              </FormField>

              <FormField
                error={errors.contact?.calendly_url?.message}
                label="Calendly URL"
                name="contact.calendly_url"
              >
                <UrlInput {...register("contact.calendly_url")} />
              </FormField>

              <FormField
                error={errors.site_url?.message}
                label="Site URL"
                name="site_url"
              >
                <UrlInput {...register("site_url")} />
              </FormField>
            </div>
          </FormSection>
        </div>
      ) : null}
    </EntityForm>
  )
}

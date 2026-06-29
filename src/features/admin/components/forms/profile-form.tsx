"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"

import {
  AvatarImageField,
  EntityForm,
  FormField,
  FormSection,
  TextArea,
  TextInput,
} from "@/features/admin/components/forms"
import {
  createWizardSaveAction,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { PROFILE_FORM_STEPS } from "@/features/admin/components/forms/profile-form-steps"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { updateProfile } from "@/features/admin/lib/actions/settings"
import {
  type ProfileFormData,
  profileFormSchema,
  type ProfileFormValues,
  toProfileFormValues,
} from "@/features/admin/lib/schemas"
import type { SiteSettings } from "@/features/portfolio/lib/settings"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"

type ProfileFormProps = {
  site: SiteSettings
}

export function ProfileForm({ site }: ProfileFormProps) {
  const { formError, isPending, setFormError, submit } = useFormSubmission()

  const form = useForm<ProfileFormValues, unknown, ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toProfileFormValues(site),
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
    steps: PROFILE_FORM_STEPS,
    mode: "edit",
    trigger: (fields) => trigger(fields as Parameters<typeof trigger>[0]),
    setFormError,
  })

  const saveProfile = useCallback(
    async (values: ProfileFormData) => {
      const result = await submit(() => updateProfile(values), {
        successMessage: SAVE_MESSAGES.profile,
      })
      if (result && !result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }
    },
    [setError, submit]
  )

  const onSubmit = handleSubmit(saveProfile, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveProfile, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveProfile]
  )

  return (
    <EntityForm formError={formError} onSubmit={onSubmit}>
      <EntityFormWizardNav
        actions={{
          isSubmitting: isPending,
          onBack: handlePreviousStep,
          onNext: handleNextStep,
          onSave,
          submitLabel: "Save profile",
        }}
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepChange={goToStep}
        steps={PROFILE_FORM_STEPS}
      />

      {currentStep === 0 ? (
        <div className="space-y-5">
          <FormSection
            description="Circular homepage photo, display name, title, and short bio shown in the workspace header."
            title="Homepage profile"
            variant="card"
          >
            <Controller
              control={control}
              name="owner_avatar"
              render={({ field }) => (
                <AvatarImageField
                  error={errors.owner_avatar?.message}
                  onChange={field.onChange}
                  value={field.value ?? ""}
                  variant="profile"
                />
              )}
            />

            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              <FormField
                error={errors.owner_name?.message}
                label="Name"
                name="owner_name"
              >
                <TextInput {...register("owner_name")} />
              </FormField>

              <FormField
                error={errors.owner_title?.message}
                label="Title"
                name="owner_title"
              >
                <TextInput {...register("owner_title")} />
              </FormField>
            </div>

            <FormField
              error={errors.site_name?.message}
              hint="Used as a fallback when name is empty."
              label="Site name"
              name="site_name"
            >
              <TextInput {...register("site_name")} />
            </FormField>

            <FormField
              error={errors.site_description?.message}
              label="Short bio"
              name="site_description"
            >
              <TextArea rows={3} {...register("site_description")} />
            </FormField>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <FormSection
            description="Presence Engine inputs for status bubble, avatar tooltip, and time block."
            title="Workspace presence"
            variant="card"
          >
            <FormField
              error={errors.custom_status?.message}
              hint="Overrides all generated presence messages when enabled below."
              label="Custom status"
              name="custom_status"
            >
              <TextInput
                {...register("custom_status")}
                placeholder="Preparing a conference paper"
              />
            </FormField>

            <FormField label="Presence enabled" name="status_enabled">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("status_enabled")} />
                Use custom status override when set
              </label>
            </FormField>

            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              <FormField
                error={errors.current_project?.message}
                hint="Primary project for project-aware messages."
                label="Current project"
                name="current_project"
              >
                <TextInput
                  {...register("current_project")}
                  placeholder="BohrAI"
                />
              </FormField>

              <FormField
                error={errors.currently_building?.message}
                label="Currently building"
                name="currently_building"
              >
                <TextInput
                  {...register("currently_building")}
                  placeholder="Enterprise AI Platform"
                />
              </FormField>

              <FormField
                error={errors.currently_reading?.message}
                label="Reading"
                name="currently_reading"
              >
                <TextInput
                  {...register("currently_reading")}
                  placeholder="Agentic Design Patterns"
                />
              </FormField>

              <FormField
                error={errors.next_project?.message}
                hint="Shown as Next Focus on avatar hover."
                label="Next focus"
                name="next_project"
              >
                <TextInput {...register("next_project")} />
              </FormField>
            </div>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-5">
          <FormSection
            description="Proof points and summary copy shown on the homepage About section."
            title="Homepage highlights"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              <FormField
                error={errors.focus_areas?.message}
                hint="Shown inline on homepage About section."
                label="Focus areas"
                name="focus_areas"
              >
                <TextArea rows={2} {...register("focus_areas")} />
              </FormField>

              <FormField
                error={errors.selected_metrics?.message}
                hint="Typography-only proof section on homepage."
                label="Selected metrics"
                name="selected_metrics"
              >
                <TextArea rows={2} {...register("selected_metrics")} />
              </FormField>
            </div>

            <FormField
              error={errors.experience_summary?.message}
              label="Experience summary"
              name="experience_summary"
            >
              <TextInput {...register("experience_summary")} />
            </FormField>
          </FormSection>
        </div>
      ) : null}
    </EntityForm>
  )
}

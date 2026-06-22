"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  EntityForm,
  FormField,
  FormSection,
  SaveBar,
  TextInput,
} from "@/components/admin/forms"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { updateSettings } from "@/lib/admin/actions/settings"
import {
  type SettingsFormData,
  settingsFormSchema,
  type SettingsFormValues,
  toSettingsFormValues,
} from "@/lib/admin/schemas"
import type { PublicSettings } from "@/lib/public/settings"

type SettingsFormProps = {
  settings: PublicSettings
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<SettingsFormValues, unknown, SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toSettingsFormValues(settings),
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    const result = await submit(() => updateSettings(values))
    if (result && !result.success) {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  return (
    <EntityForm formError={formError} onSubmit={onSubmit}>
      <FormSection description="Public social profile links." title="Social links">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={errors.social?.github?.message} label="GitHub" name="social.github">
            <TextInput {...register("social.github")} />
          </FormField>

          <FormField
            error={errors.social?.linkedin?.message}
            label="LinkedIn"
            name="social.linkedin"
          >
            <TextInput {...register("social.linkedin")} />
          </FormField>

          <FormField error={errors.social?.twitter?.message} label="X / Twitter" name="social.twitter">
            <TextInput {...register("social.twitter")} />
          </FormField>

          <FormField error={errors.social?.substack?.message} label="Substack" name="social.substack">
            <TextInput {...register("social.substack")} />
          </FormField>

          <FormField error={errors.social?.medium?.message} label="Medium" name="social.medium">
            <TextInput {...register("social.medium")} />
          </FormField>

          <FormField error={errors.social?.discord?.message} label="Discord" name="social.discord">
            <TextInput {...register("social.discord")} />
          </FormField>

          <FormField error={errors.social?.youtube?.message} label="YouTube" name="social.youtube">
            <TextInput {...register("social.youtube")} />
          </FormField>

          <FormField error={errors.social?.bluesky?.message} label="Bluesky" name="social.bluesky">
            <TextInput {...register("social.bluesky")} />
          </FormField>

          <FormField error={errors.social?.threads?.message} label="Threads" name="social.threads">
            <TextInput {...register("social.threads")} />
          </FormField>

          <FormField error={errors.social?.devto?.message} label="Dev.to" name="social.devto">
            <TextInput {...register("social.devto")} />
          </FormField>

          <FormField
            error={errors.social?.instagram?.message}
            label="Instagram"
            name="social.instagram"
          >
            <TextInput {...register("social.instagram")} />
          </FormField>
        </div>
      </FormSection>

      <FormSection description="Contact details and canonical site URL." title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={errors.contact?.email?.message} label="Email" name="contact.email">
            <TextInput type="email" {...register("contact.email")} />
          </FormField>

          <FormField error={errors.contact?.location?.message} label="Location" name="contact.location">
            <TextInput {...register("contact.location")} />
          </FormField>

          <FormField
            error={errors.contact?.calendly_url?.message}
            label="Calendly URL"
            name="contact.calendly_url"
          >
            <TextInput {...register("contact.calendly_url")} />
          </FormField>

          <FormField error={errors.site_url?.message} label="Site URL" name="site_url">
            <TextInput {...register("site_url")} />
          </FormField>
        </div>
      </FormSection>

      <SaveBar isSubmitting={isPending} />
    </EntityForm>
  )
}

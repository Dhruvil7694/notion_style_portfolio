"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import {
  AvatarImageField,
  EntityForm,
  FormField,
  FormSection,
  SaveBar,
  TextArea,
  TextInput,
} from "@/components/admin/forms"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { updateAbout } from "@/lib/admin/actions/settings"
import {
  type AboutPageFormData,
  aboutPageFormSchema,
  type AboutPageFormValues,
  toAboutFormValues,
} from "@/lib/admin/schemas"
import type { AboutContent } from "@/lib/public/about-content"
import type { SiteSettings } from "@/lib/public/settings"

type AboutFormProps = {
  site: SiteSettings
  about: AboutContent
}

export function AboutForm({ site, about }: AboutFormProps) {
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<AboutPageFormValues, unknown, AboutPageFormData>({
    resolver: zodResolver(aboutPageFormSchema),
    defaultValues: toAboutFormValues({ site, about }),
  })

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    const result = await submit(() => updateAbout(values))
    if (result && !result.success) {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  return (
    <EntityForm formError={formError} onSubmit={onSubmit}>
      <FormSection
        description="Photo and long-form copy for the public About Me page."
        title="About page"
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

        <FormField error={errors.intro_tools?.message} label="Intro tools line" name="intro_tools">
          <TextArea rows={2} {...register("intro_tools")} />
        </FormField>

        <FormField error={errors.career_intro?.message} label="Career intro" name="career_intro">
          <TextArea rows={2} {...register("career_intro")} />
        </FormField>

        <FormField
          error={errors.after_umbrella?.message}
          label="After umbrella paragraph"
          name="after_umbrella"
        >
          <TextArea rows={3} {...register("after_umbrella")} />
        </FormField>

        <FormField error={errors.retrieval?.message} label="Retrieval paragraph" name="retrieval">
          <TextArea rows={3} {...register("retrieval")} />
        </FormField>

        <FormField error={errors.ownership?.message} label="Ownership paragraph" name="ownership">
          <TextArea rows={3} {...register("ownership")} />
        </FormField>

        <FormField error={errors.outside?.message} label="Outside work paragraph" name="outside">
          <TextArea rows={3} {...register("outside")} />
        </FormField>

        <FormField error={errors.mcp?.message} label="MCP paragraph" name="mcp">
          <TextArea rows={3} {...register("mcp")} />
        </FormField>

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

      <SaveBar isSubmitting={isPending} />
    </EntityForm>
  )
}

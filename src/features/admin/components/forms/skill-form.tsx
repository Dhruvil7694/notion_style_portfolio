"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import {
  DeleteDialog,
  EntityForm,
  FormField,
  SaveBar,
  SelectInput,
  TextInput,
} from "@/features/admin/components/forms"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createSkill,
  deleteSkill,
  updateSkill,
} from "@/features/admin/lib/actions/skills"
import {
  skillCategorySchema,
  type SkillFormData,
  skillFormSchema,
  type SkillFormValues,
  skillProficiencySchema,
} from "@/features/admin/lib/schemas"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { Skill } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

type SkillFormProps = {
  mode: "create" | "edit"
  skill?: Skill
  variant?: "page" | "panel"
  onSuccess?: () => void
  onCancel?: () => void
}

const routes = adminResourceRoutes.skills

export function SkillForm({
  mode,
  skill,
  variant = "page",
  onSuccess,
  onCancel,
}: SkillFormProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<SkillFormValues, unknown, SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      category: skill?.category ?? "language",
      name: skill?.name ?? "",
      proficiency: skill?.proficiency ?? "",
      show_on_landing: skill?.show_on_landing ?? false,
    },
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      const result = await submit(() => createSkill(values), {
        successMessage: SAVE_MESSAGES.skill,
      })
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        return
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

    if (!skill) {
      return
    }

    const result = await submit(() => updateSkill(skill.id, values), {
      successMessage: SAVE_MESSAGES.skill,
    })
    if (result.success) {
      router.refresh()
    } else {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  async function handleDelete() {
    if (!skill) {
      return
    }

    setIsDeleting(true)
    await deleteSkill(skill.id)
  }

  const formBody = (
    <EntityForm
      className={variant === "panel" ? "space-y-5 pb-0" : undefined}
      formError={formError}
      onSubmit={onSubmit}
    >
      <FormField
        error={errors.category?.message}
        label="Category"
        name="category"
        required
      >
        <SelectInput id="category" {...register("category")}>
          {skillCategorySchema.options.map((category) => (
            <option key={category} value={category}>
              {category.replaceAll("_", " ")}
            </option>
          ))}
        </SelectInput>
      </FormField>

      <FormField error={errors.name?.message} label="Name" name="name" required>
        <TextInput id="name" {...register("name")} />
      </FormField>

      <FormField
        error={errors.proficiency?.message}
        label="Proficiency"
        name="proficiency"
      >
        <SelectInput
          defaultValue=""
          id="proficiency"
          {...register("proficiency")}
        >
          <option value="">Not set</option>
          {skillProficiencySchema.options.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </SelectInput>
      </FormField>

      <FormField
        hint="Technologies still appear on /stack when hidden here."
        label="Show on landing"
        name="show_on_landing"
      >
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("show_on_landing")} />
          Include in the home page stack showcase
        </label>
      </FormField>

      {variant === "panel" ? (
        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel ? (
            <button
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          ) : null}
          <button
            className={cn(buttonVariants({ size: "sm" }))}
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Creating…" : "Create skill"}
          </button>
        </div>
      ) : (
        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create skill" : "Save changes"}
        />
      )}
    </EntityForm>
  )

  if (variant === "panel") {
    return formBody
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Add metadata for a technology in the stack."
              : "Update category, proficiency, and landing visibility."
          }
          title={
            mode === "create" ? "New skill" : (skill?.name ?? "Edit skill")
          }
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
        description="This permanently removes the skill."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete skill?"
      />
    </div>
  )
}

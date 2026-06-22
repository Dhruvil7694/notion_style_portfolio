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
} from "@/components/admin/forms"
import { PageHeader } from "@/components/admin/page-header"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createSkill,
  deleteSkill,
  updateSkill,
} from "@/lib/admin/actions/skills"
import {
  skillCategorySchema,
  type SkillFormData,
  skillFormSchema,
  type SkillFormValues,
  skillProficiencySchema,
} from "@/lib/admin/schemas"
import { cn } from "@/lib/utils"
import type { Skill } from "@/types/database.helpers"

type SkillFormProps = {
  mode: "create" | "edit"
  skill?: Skill
}

const routes = adminResourceRoutes.skills

export function SkillForm({ mode, skill }: SkillFormProps) {
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
      const result = await submit(() => createSkill(values))
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
      }
      return
    }

    if (!skill) {
      return
    }

    const result = await submit(() => updateSkill(skill.id, values))
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Add metadata for a technology in the stack."
              : "Update category, proficiency, and landing visibility."
          }
          title={mode === "create" ? "New skill" : (skill?.name ?? "Edit skill")}
        />
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={routes.list}>
          Back to list
        </Link>
      </div>

      <EntityForm formError={formError} onSubmit={onSubmit}>
        <FormField error={errors.category?.message} label="Category" name="category" required>
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

        <FormField error={errors.proficiency?.message} label="Proficiency" name="proficiency">
          <SelectInput defaultValue="" id="proficiency" {...register("proficiency")}>
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

        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create skill" : "Save changes"}
        />
      </EntityForm>

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

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { ContentField } from "@/components/admin/content-field"
import {
  DeleteDialog,
  EntityForm,
  FormField,
  FormSection,
  SaveBar,
  SelectInput,
  StatusSelector,
  TextArea,
  TextInput,
} from "@/components/admin/forms"
import { PageHeader } from "@/components/admin/page-header"
import { buttonVariants } from "@/components/ui/button"
import { adminResourceRoutes } from "@/config/admin-resource-routes"
import { BulletListField } from "@/features/admin/forms/bullet-list-field"
import { FaqField } from "@/features/admin/forms/faq-field"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createContent,
  deleteContent,
  updateContent,
} from "@/lib/admin/actions/content"
import {
  commaListToText,
  type ContentFormData,
  contentFormSchema,
  type ContentFormValues,
  contentTypeSchema,
} from "@/lib/admin/schemas"
import { deserializeContent } from "@/lib/content/serializer"
import { parseFaqItems } from "@/lib/knowledge/schemas"
import { cn } from "@/lib/utils"
import type { Content } from "@/types/database.helpers"

type ContentFormProps = {
  mode: "create" | "edit"
  content?: Content
}

const routes = adminResourceRoutes.content
const contentTypes = contentTypeSchema.options

export function ContentForm({ mode, content }: ContentFormProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, submit } = useFormSubmission()

  const form = useForm<ContentFormValues, unknown, ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      type: content?.type ?? "blog",
      title: content?.title ?? "",
      slug: content?.slug ?? "",
      excerpt: content?.excerpt ?? "",
      tags: commaListToText(content?.tags),
      status: content?.status === "published" ? "published" : "draft",
      content: deserializeContent(content?.content),
      ai_summary: content?.ai_summary ?? "",
      key_takeaways: content?.key_takeaways ?? [],
      expertise_slugs: content?.expertise_slugs ?? [],
      concepts: commaListToText(content?.concepts),
      faq: parseFaqItems(content?.faq),
    },
  })

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "create") {
      const result = await submit(() => createContent(values))
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
      }
      return
    }

    if (!content) {
      return
    }

    const result = await submit(() => updateContent(content.id, values))
    if (result.success) {
      router.refresh()
    } else {
      applyServerFieldErrors(setError, result.fieldErrors)
    }
  })

  async function handleDelete() {
    if (!content) {
      return
    }

    setIsDeleting(true)
    await deleteContent(content.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Create blog, research, automation, or note content."
              : "Update content metadata and publishing status."
          }
          title={mode === "create" ? "New content" : (content?.title ?? "Edit content")}
        />
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={routes.list}>
          Back to list
        </Link>
      </div>

      <EntityForm formError={formError} onSubmit={onSubmit}>
        <FormField error={errors.type?.message} label="Type" name="type" required>
          <SelectInput id="type" {...register("type")}>
            {contentTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <div className="grid gap-6 lg:grid-cols-2">
          <FormField error={errors.title?.message} label="Title" name="title" required>
            <TextInput id="title" {...register("title")} />
          </FormField>
          <FormField error={errors.slug?.message} label="Slug" name="slug" required>
            <TextInput id="slug" {...register("slug")} />
          </FormField>
        </div>

        <FormField error={errors.excerpt?.message} label="Excerpt" name="excerpt">
          <TextArea id="excerpt" {...register("excerpt")} />
        </FormField>

        <FormField
          error={errors.tags?.message}
          hint="Comma-separated tags."
          label="Tags"
          name="tags"
        >
          <TextInput id="tags" {...register("tags")} />
        </FormField>

        <StatusSelector
          error={errors.status?.message}
          onChange={(value) => setValue("status", value, { shouldValidate: true })}
          value={watch("status")}
        />

        <ContentField
          autosaveEnabled={mode === "edit" && !!content}
          error={errors.content?.message}
          label="Body"
          onAutosave={async (contentDocument) => {
            if (!content) {
              return { success: false, error: "Content not found" }
            }

            return updateContent(content.id, { ...getValues(), content: contentDocument })
          }}
          onChange={(document) =>
            setValue("content", document, { shouldValidate: true, shouldDirty: true })
          }
          value={watch("content")}
        />

        <FormSection
          description="Machine-readable fields for AEO and knowledge graph linking."
          title="Knowledge graph"
        >
          <FormField error={errors.ai_summary?.message} label="AI summary" name="ai_summary">
            <TextArea
              id="ai_summary"
              {...register("ai_summary")}
              placeholder="2–5 sentence machine-readable summary for LLM retrieval."
              rows={3}
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
                setValue("key_takeaways", value, { shouldDirty: true, shouldValidate: true })
              }
              value={watch("key_takeaways") ?? []}
            />
          </FormField>
          <FormField
            error={errors.expertise_slugs?.message}
            label="Expertise slugs"
            name="expertise_slugs"
          >
            <TextInput
              placeholder="rag-systems, multi-agent-systems"
              value={(watch("expertise_slugs") ?? []).join(", ")}
              onChange={(event) =>
                setValue(
                  "expertise_slugs",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  { shouldDirty: true, shouldValidate: true }
                )
              }
            />
          </FormField>
          <FormField error={errors.concepts?.message} label="Concepts" name="concepts">
            <TextInput id="concepts" {...register("concepts")} placeholder="RAG, Vector Search" />
          </FormField>
          <FormField error={errors.faq?.message} label="FAQ" name="faq">
            <FaqField
              onChange={(value) =>
                setValue("faq", value, { shouldDirty: true, shouldValidate: true })
              }
              value={watch("faq") ?? []}
            />
          </FormField>
        </FormSection>

        <SaveBar
          isDeleting={isDeleting}
          isSubmitting={isPending}
          onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          submitLabel={mode === "create" ? "Create content" : "Save changes"}
        />
      </EntityForm>

      <DeleteDialog
        description="This permanently removes the content item."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete content?"
      />
    </div>
  )
}

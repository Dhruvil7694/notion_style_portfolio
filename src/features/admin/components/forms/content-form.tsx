"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import { ContentField } from "@/features/admin/components/content-field"
import {
  DeleteDialog,
  EntityForm,
  FormField,
  FormSection,
  SelectInput,
  StatusSelector,
  TextArea,
  TextInput,
} from "@/features/admin/components/forms"
import { BulletListField } from "@/features/admin/components/forms/bullet-list-field"
import { CONTENT_FORM_STEPS } from "@/features/admin/components/forms/content-form-steps"
import {
  createWizardSaveAction,
  EntityFormWizardFooter,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { FaqField } from "@/features/admin/components/forms/faq-field"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createContent,
  deleteContent,
  updateContent,
} from "@/features/admin/lib/actions/content"
import {
  commaListToText,
  type ContentFormData,
  contentFormSchema,
  type ContentFormValues,
  contentTypeSchema,
} from "@/features/admin/lib/schemas"
import { deserializeContent } from "@/features/content/lib/serializer"
import {
  buildContentFaqTemplate,
  type ContentFaqType,
} from "@/features/knowledge-base/lib/faq-templates"
import { parseFaqItems } from "@/features/knowledge-base/lib/schemas"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { Content } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

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
  const { formError, isPending, setFormError, submit } = useFormSubmission()

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
    steps: CONTENT_FORM_STEPS,
    mode,
    trigger,
    setFormError,
  })

  const saveContent = useCallback(
    async (values: ContentFormData) => {
      if (mode === "create") {
        const result = await submit(() => createContent(values), {
          successMessage: SAVE_MESSAGES.content,
        })
        if (!result.success) {
          applyServerFieldErrors(setError, result.fieldErrors)
          throw new Error("Create failed")
        }
        return
      }

      if (!content) {
        throw new Error("Content not found")
      }

      const result = await submit(() => updateContent(content.id, values), {
        successMessage: SAVE_MESSAGES.content,
      })
      if (result.success) {
        router.refresh()
        return
      }

      applyServerFieldErrors(setError, result.fieldErrors)
      throw new Error("Save failed")
    },
    [content, mode, router, setError, submit]
  )

  const onSubmit = handleSubmit(saveContent, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveContent, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveContent]
  )

  async function handleDelete() {
    if (!content) {
      return
    }

    setIsDeleting(true)
    await deleteContent(content.id)
  }

  const pageTitle =
    mode === "create" ? "New content" : (content?.title ?? "Edit content")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Create blog, research, automation, or note content."
              : "Update content metadata and publishing status."
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
            submitLabel: mode === "create" ? "Create content" : "Save changes",
          }}
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepChange={goToStep}
          steps={CONTENT_FORM_STEPS}
        />

        {currentStep === 0 ? (
          <div className="space-y-5">
            <FormSection
              description="Content type, identity, and publishing status."
              title="Basics"
              variant="card"
            >
              <FormField
                error={errors.type?.message}
                label="Type"
                name="type"
                required
              >
                <SelectInput id="type" {...register("type")}>
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
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
              </div>

              <FormField
                error={errors.excerpt?.message}
                label="Excerpt"
                name="excerpt"
              >
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
                onChange={(value) =>
                  setValue("status", value, { shouldValidate: true })
                }
                value={watched.status}
              />
            </FormSection>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="space-y-5">
            <FormSection
              description="Rich text stored as structured JSON blocks."
              title="Body"
              variant="card"
            >
              <ContentField
                autosaveEnabled={mode === "edit" && !!content}
                error={errors.content?.message}
                label="Body"
                onAutosave={async (contentDocument) => {
                  if (!content) {
                    return { success: false, error: "Content not found" }
                  }

                  return updateContent(content.id, {
                    ...getValues(),
                    content: contentDocument,
                  })
                }}
                onChange={(document) =>
                  setValue("content", document, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                value={watched.content}
              />
            </FormSection>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="space-y-5">
            <FormSection
              description="Machine-readable fields for AEO and knowledge graph linking."
              title="Knowledge graph"
              variant="card"
            >
              <FormField
                error={errors.ai_summary?.message}
                label="AI summary"
                name="ai_summary"
              >
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
                    setValue("key_takeaways", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  value={watched.key_takeaways ?? []}
                />
              </FormField>
              <FormField
                error={errors.expertise_slugs?.message}
                label="Expertise slugs"
                name="expertise_slugs"
              >
                <TextInput
                  placeholder="rag-systems, multi-agent-systems"
                  value={(watched.expertise_slugs ?? []).join(", ")}
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
              <FormField
                error={errors.concepts?.message}
                label="Concepts"
                name="concepts"
              >
                <TextInput
                  id="concepts"
                  {...register("concepts")}
                  placeholder="RAG, Vector Search"
                />
              </FormField>
              <FormField error={errors.faq?.message} label="FAQ" name="faq">
                <FaqField
                  onApplyTemplate={() => {
                    const type = watched.type
                    const contentType: ContentFaqType =
                      type === "research" || type === "automation"
                        ? type
                        : "blog"

                    return buildContentFaqTemplate({
                      type: contentType,
                      title: watched.title,
                      excerpt: watched.excerpt,
                      ai_summary: watched.ai_summary,
                      key_takeaways: watched.key_takeaways,
                      tags: (watched.tags ?? "")
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                      expertise_slugs: watched.expertise_slugs,
                    })
                  }}
                  onChange={(value) =>
                    setValue("faq", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  value={watched.faq ?? []}
                />
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

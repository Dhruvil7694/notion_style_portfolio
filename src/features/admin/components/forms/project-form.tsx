"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import { type FieldErrors, useForm } from "react-hook-form"

import { AdminPageMeta } from "@/features/admin/components/admin-page-meta"
import { ContentField } from "@/features/admin/components/content-field"
import {
  CharacterCounter,
  CoverImageField,
  DeleteDialog,
  EntityForm,
  FormField,
  FormSection,
  IconPicker,
  StatusSelector,
  TextArea,
  TextInput,
  UrlInput,
} from "@/features/admin/components/forms"
import { AIDesignGraphEditor } from "@/features/admin/components/forms/ai-design-graph-editor"
import { ArchitectureGraphEditor } from "@/features/admin/components/forms/architecture-graph-editor"
import { BulletListField } from "@/features/admin/components/forms/bullet-list-field"
import { ChallengesField } from "@/features/admin/components/forms/challenges-field"
import { createWizardSaveAction } from "@/features/admin/components/forms/entity-form-wizard"
import { FactsField } from "@/features/admin/components/forms/facts-field"
import { FaqField } from "@/features/admin/components/forms/faq-field"
import { MetricsField } from "@/features/admin/components/forms/metrics-field"
import { PROJECT_FORM_STEPS } from "@/features/admin/components/forms/project-form-steps"
import {
  ProjectFormWizardFooter,
  ProjectFormWizardNav,
} from "@/features/admin/components/forms/project-form-wizard"
import { ProjectGalleryField } from "@/features/admin/components/forms/project-gallery-field"
import { ProjectLivePreviewPanel } from "@/features/admin/components/forms/project-live-preview-panel"
import { StepBuilderField } from "@/features/admin/components/forms/step-builder-field"
import { TechStackGroupsField } from "@/features/admin/components/forms/tech-stack-groups-field"
import { TimelineField } from "@/features/admin/components/forms/timeline-field"
import { TradeoffsField } from "@/features/admin/components/forms/tradeoffs-field"
import { PageHeader } from "@/features/admin/components/page-header"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/features/admin/lib/actions/projects"
import {
  commaListToText,
  type ProjectFormData,
  projectFormSchema,
  type ProjectFormValues,
} from "@/features/admin/lib/schemas"
import { deserializeContent } from "@/features/content/lib/serializer"
import {
  parseArchitectureGraph,
  parseArchitectureGraphEdges,
  parseArchitectureGraphNodes,
} from "@/features/diagrams/lib/architecture-graph.schema"
import { buildProjectFaqTemplate } from "@/features/knowledge-base/lib/faq-templates"
import { parseFaqItems } from "@/features/knowledge-base/lib/schemas"
import {
  parseFlowNodes,
  parseProjectChallenges,
  parseProjectGallery,
  parseProjectMetrics,
  parseProjectTimeline,
  parseProjectTradeoffs,
  parseStringArray,
  parseTechStackGroups,
} from "@/features/portfolio/lib/project-case-study"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"
import type { Project } from "@/shared/types/database.helpers"
import { buttonVariants } from "@/shared/ui/button"

type ProjectFormProps = {
  mode: "create" | "edit"
  project?: Project
}

const routes = adminResourceRoutes.projects

export function ProjectForm({ mode, project }: ProjectFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [maxReachedStep, setMaxReachedStep] = useState(
    mode === "edit" ? PROJECT_FORM_STEPS.length - 1 : 0
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { formError, isPending, setFormError, submit } = useFormSubmission()

  const form = useForm<ProjectFormValues, unknown, ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title ?? "",
      slug: project?.slug ?? "",
      summary: project?.summary ?? "",
      tagline: project?.tagline ?? "",
      icon_name: project?.icon_name ?? "",
      cover_image: project?.cover_image ?? "",
      thumbnail: project?.thumbnail ?? "",
      demo_video_url: project?.demo_video_url ?? "",
      architecture_image: project?.architecture_image ?? "",
      year: project?.year ?? "",
      category: project?.category ?? "",
      role: project?.role ?? "",
      project_url: project?.project_url ?? project?.live_url ?? "",
      github_url: project?.github_url ?? "",
      challenge: project?.challenge ?? "",
      solution: project?.solution ?? "",
      impact: project?.impact ?? "",
      overview: project?.overview ?? "",
      problem: project?.problem ?? "",
      why_built: project?.why_built ?? "",
      approach: parseStringArray(project?.approach),
      ai_design: parseFlowNodes(project?.ai_design),
      architecture: parseFlowNodes(project?.architecture),
      ai_design_nodes: parseArchitectureGraphNodes(project?.ai_design_nodes),
      ai_design_edges: parseArchitectureGraphEdges(project?.ai_design_edges),
      architecture_nodes: parseArchitectureGraphNodes(
        project?.architecture_nodes
      ),
      architecture_edges: parseArchitectureGraphEdges(
        project?.architecture_edges
      ),
      metrics: parseProjectMetrics(project?.metrics),
      tradeoffs: parseProjectTradeoffs(project?.tradeoffs),
      my_contribution: parseStringArray(project?.my_contribution),
      tech_stack_groups: parseTechStackGroups(project?.tech_stack_groups).map(
        (group) => ({
          category: group.category,
          items: group.items,
        })
      ),
      timeline: parseProjectTimeline(project?.timeline),
      gallery: parseProjectGallery(project?.gallery, project?.demo_images),
      challenges: parseProjectChallenges(project?.challenges),
      results: parseStringArray(project?.results),
      learnings: parseStringArray(project?.learnings),
      ai_summary: project?.ai_summary ?? "",
      key_takeaways: parseStringArray(project?.key_takeaways),
      concepts: commaListToText(project?.concepts),
      expertise_slugs: project?.expertise_slugs ?? [],
      technologies: commaListToText(project?.technologies),
      project_facts: (project?.project_facts as Record<string, string>) ?? {},
      faq: parseFaqItems(project?.faq),
      hover_preview_enabled: project?.hover_preview_enabled ?? true,
      display_order: project?.display_order ?? 0,
      tech_stack: commaListToText(project?.tech_stack),
      featured: project?.featured ?? false,
      status: project?.status === "published" ? "published" : "draft",
      content: deserializeContent(project?.content),
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

  const scrollToFormTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
      scrollToFormTop()
    },
    [scrollToFormTop]
  )

  const handleInvalidSubmit = useCallback(
    (invalidErrors: FieldErrors<ProjectFormValues>) => {
      setFormError("Fix the highlighted fields before saving.")
      const errorKeys = Object.keys(invalidErrors)
      const errorStep = PROJECT_FORM_STEPS.findIndex((step) =>
        step.fields.some((field) => errorKeys.includes(field))
      )

      if (errorStep >= 0) {
        setMaxReachedStep((value) => Math.max(value, errorStep))
        goToStep(errorStep)
        return
      }

      scrollToFormTop()
    },
    [goToStep, scrollToFormTop, setFormError]
  )

  const saveProject = useCallback(
    async (values: ProjectFormData) => {
      if (mode === "create") {
        const result = await submit(() => createProject(values), {
          successMessage: SAVE_MESSAGES.project,
        })
        if (!result.success) {
          applyServerFieldErrors(setError, result.fieldErrors)
          throw new Error("Create failed")
        }
        return
      }

      if (!project) {
        throw new Error("Project not found")
      }

      const result = await submit(() => updateProject(project.id, values), {
        successMessage: SAVE_MESSAGES.project,
      })
      if (!result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }
    },
    [mode, project, setError, submit]
  )

  const onSubmit = handleSubmit(saveProject, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveProject, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveProject]
  )

  async function handleDelete() {
    if (!project) {
      return
    }

    setIsDeleting(true)
    await deleteProject(project.id)
  }

  async function handleNextStep() {
    const stepFields = PROJECT_FORM_STEPS[currentStep]?.fields ?? []
    const valid = await trigger(stepFields)

    if (!valid) {
      setFormError("Fix the highlighted fields before continuing.")
      scrollToFormTop()
      return
    }

    setFormError(null)
    const nextStep = Math.min(currentStep + 1, PROJECT_FORM_STEPS.length - 1)
    setMaxReachedStep((value) => Math.max(value, nextStep))
    goToStep(nextStep)
  }

  function handlePreviousStep() {
    if (currentStep === 0) {
      return
    }

    setFormError(null)
    goToStep(currentStep - 1)
  }

  const pageTitle =
    mode === "create" ? "New project" : (project?.title ?? "Edit project")

  return (
    <div className="space-y-6">
      <AdminPageMeta title={pageTitle} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description={
            mode === "create"
              ? "Create a new portfolio project."
              : "Update project details and publishing status."
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

      <div
        className={cn(
          "grid gap-8",
          previewOpen
            ? "xl:grid-cols-[minmax(0,1fr)_320px]"
            : "xl:grid-cols-[minmax(0,1fr)_auto]"
        )}
      >
        <EntityForm formError={formError} onSubmit={onSubmit}>
          <ProjectFormWizardNav
            actions={{
              isDeleting,
              isSubmitting: isPending,
              onBack: handlePreviousStep,
              onNext: handleNextStep,
              onSave,
              submitLabel:
                mode === "create" ? "Create project" : "Save changes",
            }}
            currentStep={currentStep}
            maxReachedStep={maxReachedStep}
            onStepChange={goToStep}
            steps={PROJECT_FORM_STEPS}
          />

          {currentStep === 0 ? (
            <div className="space-y-5">
              <FormSection
                variant="card"
                description="Core identity and publishing state."
                title="Basic information"
              >
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
                    hint="Lowercase letters, numbers, and hyphens."
                    label="Slug"
                    name="slug"
                    required
                  >
                    <TextInput id="slug" {...register("slug")} />
                  </FormField>
                </div>

                <FormField
                  error={errors.tagline?.message}
                  hint="Short subtitle shown below the project title."
                  label="Tagline"
                  name="tagline"
                >
                  <div className="space-y-1">
                    <TextInput
                      id="tagline"
                      maxLength={120}
                      {...register("tagline")}
                    />
                    <CharacterCounter max={120} value={watched.tagline ?? ""} />
                  </div>
                </FormField>

                <FormField
                  error={errors.summary?.message}
                  hint="Used for search indexing and SEO. Keep separate from tagline."
                  label="Summary"
                  name="summary"
                  required
                >
                  <TextArea id="summary" {...register("summary")} rows={3} />
                </FormField>

                <StatusSelector
                  error={errors.status?.message}
                  onChange={(value) =>
                    setValue("status", value, { shouldValidate: true })
                  }
                  value={watched.status}
                />
              </FormSection>

              <FormSection
                variant="card"
                description="Listing metadata for project cards and filters."
                title="Metadata"
              >
                <div className="grid gap-x-8 gap-y-10 lg:grid-cols-3">
                  <FormField
                    error={errors.year?.message}
                    label="Year"
                    name="year"
                  >
                    <TextInput
                      id="year"
                      placeholder="2026"
                      {...register("year")}
                    />
                  </FormField>
                  <FormField
                    error={errors.category?.message}
                    label="Category"
                    name="category"
                  >
                    <TextInput
                      id="category"
                      placeholder="AI Research"
                      {...register("category")}
                    />
                  </FormField>
                  <FormField
                    error={errors.role?.message}
                    label="Role"
                    name="role"
                  >
                    <TextInput
                      id="role"
                      placeholder="Lead Engineer"
                      {...register("role")}
                    />
                  </FormField>
                </div>

                <FormField
                  error={errors.tech_stack?.message}
                  hint="Comma-separated fallback. Categorized stack below overrides this on save."
                  label="Tech stack"
                  name="tech_stack"
                >
                  <TextInput id="tech_stack" {...register("tech_stack")} />
                </FormField>
              </FormSection>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-5">
              <FormSection
                variant="card"
                description="Cover, thumbnail, architecture screenshot, and demo video for narrative sections."
                title="Project assets"
              >
                <IconPicker
                  error={errors.icon_name?.message}
                  onChange={(value) =>
                    setValue("icon_name", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  value={watched.icon_name ?? ""}
                />

                <CoverImageField
                  error={errors.cover_image?.message}
                  onChange={(url) =>
                    setValue("cover_image", url, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  projectId={project?.id}
                  projectSlug={watched.slug}
                  value={watched.cover_image ?? ""}
                />

                <FormField
                  error={errors.thumbnail?.message}
                  hint="Used on project cards. Falls back to cover image when empty."
                  label="Thumbnail URL"
                  name="thumbnail"
                >
                  <UrlInput
                    id="thumbnail"
                    placeholder="https://..."
                    {...register("thumbnail")}
                  />
                </FormField>

                <FormField
                  error={errors.architecture_image?.message}
                  hint="Static architecture screenshot shown above the interactive diagram."
                  label="Architecture image URL"
                  name="architecture_image"
                >
                  <UrlInput
                    id="architecture_image"
                    placeholder="https://..."
                    {...register("architecture_image")}
                  />
                </FormField>

                <FormField
                  error={errors.demo_video_url?.message}
                  hint="YouTube, Vimeo, or direct MP4/WebM URL — shown in Results."
                  label="Demo video URL"
                  name="demo_video_url"
                >
                  <UrlInput
                    id="demo_video_url"
                    placeholder="https://youtube.com/watch?v=..."
                    {...register("demo_video_url")}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="External links for the project."
                title="Links"
              >
                <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
                  <FormField
                    error={errors.project_url?.message}
                    label="Project URL"
                    name="project_url"
                  >
                    <UrlInput id="project_url" {...register("project_url")} />
                  </FormField>
                  <FormField
                    error={errors.github_url?.message}
                    label="GitHub URL"
                    name="github_url"
                  >
                    <UrlInput id="github_url" {...register("github_url")} />
                  </FormField>
                </div>
              </FormSection>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-5">
              <FormSection
                variant="card"
                description="CMS-managed hover card content. Do not reuse the summary here."
                title="Hover preview"
              >
                <FormField
                  error={errors.challenge?.message}
                  hint="The problem this project addresses."
                  label="Challenge"
                  name="challenge"
                >
                  <div className="space-y-1">
                    <TextArea
                      id="challenge"
                      maxLength={300}
                      {...register("challenge")}
                      rows={3}
                    />
                    <CharacterCounter
                      max={300}
                      value={watched.challenge ?? ""}
                    />
                  </div>
                </FormField>

                <FormField
                  error={errors.solution?.message}
                  hint="How the system solves it."
                  label="Solution"
                  name="solution"
                >
                  <div className="space-y-1">
                    <TextArea
                      id="solution"
                      maxLength={300}
                      {...register("solution")}
                      rows={3}
                    />
                    <CharacterCounter
                      max={300}
                      value={watched.solution ?? ""}
                    />
                  </div>
                </FormField>

                <FormField
                  error={errors.impact?.message}
                  hint="Real-world outcome or benefit."
                  label="Impact"
                  name="impact"
                >
                  <div className="space-y-1">
                    <TextArea
                      id="impact"
                      maxLength={300}
                      {...register("impact")}
                      rows={3}
                    />
                    <CharacterCounter max={300} value={watched.impact ?? ""} />
                  </div>
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Executive summary and motivation for the project detail page."
                title="Case study"
              >
                <FormField
                  error={errors.overview?.message}
                  hint="Short executive summary. Use blank lines between paragraphs."
                  label="Overview"
                  name="overview"
                >
                  <div className="space-y-1">
                    <TextArea
                      id="overview"
                      maxLength={500}
                      {...register("overview")}
                      rows={4}
                    />
                    <CharacterCounter
                      max={500}
                      value={watched.overview ?? ""}
                    />
                  </div>
                </FormField>

                <FormField
                  error={errors.problem?.message}
                  hint="Existing pain, user frustration, and business impact."
                  label="Problem"
                  name="problem"
                >
                  <TextArea id="problem" {...register("problem")} rows={4} />
                </FormField>

                <FormField
                  error={errors.why_built?.message}
                  hint="Why you created this project and what you wanted to solve."
                  label="Why built"
                  name="why_built"
                >
                  <TextArea
                    id="why_built"
                    {...register("why_built")}
                    rows={4}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Impact numbers shown below the header — value first, label second."
                title="Metrics"
              >
                <FormField
                  error={errors.metrics?.message}
                  label="Impact metrics"
                  name="metrics"
                >
                  <MetricsField
                    onChange={(value) =>
                      setValue("metrics", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={watched.metrics ?? []}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Ordered solution steps rendered as a vertical flow."
                title="Approach"
              >
                <FormField
                  error={errors.approach?.message}
                  label="Steps"
                  name="approach"
                >
                  <StepBuilderField
                    onChange={(value) =>
                      setValue("approach", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder="Query Understanding"
                    value={watched.approach ?? []}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="What you personally designed, built, or owned."
                title="My contribution"
              >
                <FormField
                  error={errors.my_contribution?.message}
                  label="Contributions"
                  name="my_contribution"
                >
                  <BulletListField
                    addLabel="Add contribution"
                    onChange={(value) =>
                      setValue("my_contribution", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder="Designed the multi-agent orchestration layer"
                    value={watched.my_contribution ?? []}
                  />
                </FormField>
              </FormSection>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-5">
              <FormSection
                variant="card"
                description="Agent orchestration, retrieval, and model flow as an interactive graph."
                title="AI system architecture"
              >
                <FormField
                  error={
                    errors.ai_design_nodes?.message ??
                    errors.ai_design_edges?.message
                  }
                  label="Graph"
                  name="ai_design_nodes"
                >
                  <AIDesignGraphEditor
                    onChange={(graph) => {
                      setValue("ai_design_nodes", graph.nodes, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                      setValue("ai_design_edges", graph.edges, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                    value={parseArchitectureGraph(
                      watched.ai_design_nodes ?? [],
                      watched.ai_design_edges ?? []
                    )}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="System layers, services, databases, and external integrations."
                title="System architecture"
              >
                <FormField
                  error={
                    errors.architecture_nodes?.message ??
                    errors.architecture_edges?.message
                  }
                  label="Graph"
                  name="architecture_nodes"
                >
                  <ArchitectureGraphEditor
                    defaultLabel="FastAPI Gateway"
                    defaultNodeType="service"
                    onChange={(graph) => {
                      setValue("architecture_nodes", graph.nodes, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                      setValue("architecture_edges", graph.edges, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                    value={parseArchitectureGraph(
                      watched.architecture_nodes ?? [],
                      watched.architecture_edges ?? []
                    )}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Grouped technologies for the detail page. Flattens into tech_stack for filters."
                title="Tech stack categories"
              >
                <FormField
                  error={errors.tech_stack_groups?.message}
                  label="Categories"
                  name="tech_stack_groups"
                >
                  <TechStackGroupsField
                    onChange={(value) =>
                      setValue("tech_stack_groups", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={(watched.tech_stack_groups ?? []).map((group) => ({
                      category: group.category,
                      items: group.items ?? [],
                    }))}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Engineering challenges and how they were resolved."
                title="Challenges"
              >
                <FormField
                  error={errors.challenges?.message}
                  label="Entries"
                  name="challenges"
                >
                  <ChallengesField
                    onChange={(value) =>
                      setValue("challenges", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={watched.challenges ?? []}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Deliberate decisions and what they cost."
                title="Tradeoffs"
              >
                <FormField
                  error={errors.tradeoffs?.message}
                  label="Decisions"
                  name="tradeoffs"
                >
                  <TradeoffsField
                    onChange={(value) =>
                      setValue("tradeoffs", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={watched.tradeoffs ?? []}
                  />
                </FormField>
              </FormSection>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-5">
              <FormSection
                variant="card"
                description="Measurable or qualitative outcomes."
                title="Results"
              >
                <FormField
                  error={errors.results?.message}
                  label="Outcomes"
                  name="results"
                >
                  <BulletListField
                    addLabel="Add result"
                    onChange={(value) =>
                      setValue("results", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder="Reduced manual effort"
                    value={watched.results ?? []}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Engineering insights from building the system."
                title="Learnings"
              >
                <FormField
                  error={errors.learnings?.message}
                  label="Insights"
                  name="learnings"
                >
                  <BulletListField
                    addLabel="Add learning"
                    onChange={(value) =>
                      setValue("learnings", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder="Retrieval quality dominates output quality"
                    value={watched.learnings ?? []}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Optional project milestones."
                title="Timeline"
              >
                <FormField
                  error={errors.timeline?.message}
                  label="Entries"
                  name="timeline"
                >
                  <TimelineField
                    onChange={(value) =>
                      setValue("timeline", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={watched.timeline ?? []}
                  />
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Typed images embedded in the case study narrative — reorder to control carousel sequence."
                title="Project gallery"
              >
                <FormField
                  error={errors.gallery?.message}
                  label="Gallery"
                  name="gallery"
                >
                  <ProjectGalleryField
                    onChange={(value) =>
                      setValue("gallery", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    projectId={project?.id}
                    projectSlug={watched.slug}
                    value={(watched.gallery ?? []).map((item) => ({
                      url: item.url,
                      type: item.type ?? "screenshot",
                      caption: item.caption,
                      alt: item.alt,
                    }))}
                  />
                </FormField>
              </FormSection>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-5">
              <FormSection
                variant="card"
                description="Knowledge graph fields for AEO, expertise linking, and machine-readable summaries."
                title="Knowledge graph"
              >
                <FormField
                  error={errors.ai_summary?.message}
                  label="AI summary"
                  name="ai_summary"
                >
                  <TextArea
                    {...register("ai_summary")}
                    placeholder="2–5 sentence machine-readable explanation for LLM retrieval."
                    rows={4}
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
                    placeholder="Hybrid retrieval outperformed vector-only search."
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
                    {...register("concepts")}
                    placeholder="RAG, Multi-Agent Systems"
                  />
                </FormField>

                <FormField
                  error={errors.technologies?.message}
                  label="Technologies"
                  name="technologies"
                >
                  <TextInput
                    {...register("technologies")}
                    placeholder="LangGraph, FastAPI, PostgreSQL"
                  />
                </FormField>

                <FormField label="Project facts" name="project_facts">
                  <FactsField
                    onChange={(value) =>
                      setValue("project_facts", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={watched.project_facts ?? {}}
                  />
                </FormField>

                <FormField error={errors.faq?.message} label="FAQ" name="faq">
                  <FaqField
                    onApplyTemplate={() =>
                      buildProjectFaqTemplate({
                        title: watched.title,
                        summary: watched.summary,
                        tagline: watched.tagline,
                        overview: watched.overview,
                        problem: watched.problem,
                        challenge: watched.challenge,
                        solution: watched.solution,
                        impact: watched.impact,
                        approach: watched.approach,
                        tech_stack: (watched.tech_stack ?? "")
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                        technologies: (watched.technologies ?? "")
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                        results: watched.results,
                        learnings: watched.learnings,
                        role: watched.role,
                      })
                    }
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

              <FormSection
                variant="card"
                description="Homepage ordering and visibility."
                title="Display settings"
              >
                <FormField label="Featured" name="featured">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register("featured")} />
                    Show on featured sections
                  </label>
                </FormField>

                <FormField
                  error={errors.display_order?.message}
                  hint="Lower numbers appear first after featured sorting."
                  label="Display order"
                  name="display_order"
                >
                  <TextInput
                    id="display_order"
                    min={0}
                    type="number"
                    {...register("display_order")}
                  />
                </FormField>

                <FormField
                  label="Hover preview enabled"
                  name="hover_preview_enabled"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register("hover_preview_enabled")}
                    />
                    Show hover preview card on project listings
                  </label>
                </FormField>
              </FormSection>

              <FormSection
                variant="card"
                description="Supporting detail rendered below structured case study sections."
                title="Rich content"
              >
                <ContentField
                  autosaveEnabled={mode === "edit" && !!project}
                  error={errors.content?.message}
                  label="Content body"
                  onAutosave={async (content) => {
                    if (!project) {
                      return { success: false, error: "Project not found" }
                    }

                    return updateProject(project.id, {
                      ...getValues(),
                      content,
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

          <ProjectFormWizardFooter
            isDeleting={isDeleting}
            isSubmitting={isPending}
            onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
          />
        </EntityForm>

        <ProjectLivePreviewPanel
          onOpenChange={setPreviewOpen}
          open={previewOpen}
          values={{
            title: watched.title ?? "",
            tagline: watched.tagline ?? "",
            icon_name: watched.icon_name ?? "",
            year: watched.year ?? "",
            category: watched.category ?? "",
            role: watched.role ?? "",
            challenge: watched.challenge ?? "",
            solution: watched.solution ?? "",
            impact: watched.impact ?? "",
            hover_preview_enabled: watched.hover_preview_enabled ?? true,
          }}
        />
      </div>

      <DeleteDialog
        description="This permanently removes the project. This action cannot be undone."
        isDeleting={isDeleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="Delete project?"
      />
    </div>
  )
}

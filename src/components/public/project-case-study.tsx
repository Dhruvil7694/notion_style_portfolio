import Image from "next/image"
import Link from "next/link"

import { RichContentRenderer } from "@/components/content/rich-content-renderer"
import { ArchitectureDiagramLazy } from "@/components/diagrams/architecture-diagram-lazy"
import { AiSummaryBlock } from "@/components/public/ai-summary-block"
import { CaseStudyCarousel } from "@/components/public/case-study-carousel"
import { CaseStudyFigure } from "@/components/public/case-study-figure"
import { CaseStudyVideo } from "@/components/public/case-study-video"
import { ChallengeList } from "@/components/public/challenge-list"
import { ExpertiseBadges } from "@/components/public/expertise-badges"
import { FaqSection } from "@/components/public/faq-section"
import { KeyTakeawaysList } from "@/components/public/key-takeaways-list"
import { KnowledgeRelatedSection } from "@/components/public/knowledge-related-section"
import { MetricsGrid } from "@/components/public/metrics-grid"
import { PageBreadcrumbs } from "@/components/public/page-breadcrumbs"
import { ProjectFactsGrid } from "@/components/public/project-facts-grid"
import { ProjectTimeline } from "@/components/public/project-timeline"
import { RelatedProjects } from "@/components/public/related-projects"
import { TechStackCategories } from "@/components/public/tech-stack-categories"
import { TradeoffsList } from "@/components/public/tradeoffs-list"
import { ViewTracker } from "@/components/public/view-tracker"
import { deserializeContent } from "@/lib/content/serializer"
import {
  hasArchitectureGraph,
  parseArchitectureGraph,
} from "@/lib/diagrams/architecture-graph.schema"
import { parseFaqItems, parseProjectFacts } from "@/lib/knowledge/schemas"
import type { RelatedKnowledgeBundle } from "@/lib/knowledge/types"
import {
  buildProjectDetailMetadataLine,
  hasRichContent,
  parseProjectChallenges,
  parseProjectMetrics,
  parseProjectTimeline,
  parseProjectTradeoffs,
  parseStringArray,
  parseTechStackGroups,
  resolveTechStackDisplay,
} from "@/lib/public/project-case-study"
import {
  firstGalleryItemOfType,
  parseProjectGallery,
  resolveVideoEmbed,
  walkthroughGalleryItems,
} from "@/lib/public/project-gallery"
import type { Project } from "@/types/database.helpers"

type RelatedProject = Pick<
  Project,
  "id" | "slug" | "title" | "summary" | "tech_stack"
>

type ProjectCaseStudyProps = {
  project: Project
  relatedProjects: RelatedProject[]
  expertiseTitlesBySlug?: Record<string, string>
  relatedKnowledge?: RelatedKnowledgeBundle | null
}

function CaseStudyBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="case-study-block">
      <h2 className="case-study-block-title">{title}</h2>
      <div className="case-study-block-body">{children}</div>
    </section>
  )
}

function ProseParagraphs({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p
          className="case-study-paragraph"
          key={`${paragraph.slice(0, 24)}-${index}`}
        >
          {paragraph}
        </p>
      ))}
    </>
  )
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul className="case-study-list">
      {items.map((item, index) => (
        <li className="case-study-list-item" key={`${item}-${index}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function VerticalSteps({ steps }: { steps: string[] }) {
  if (steps.length === 0) {
    return null
  }

  return (
    <div className="case-study-flow">
      {steps.map((step, index) => (
        <div className="case-study-flow-item" key={`${step}-${index}`}>
          <div className="case-study-flow-node">
            <span className="case-study-step-index">{index + 1}</span>
            <span className="case-study-step-text">{step}</span>
          </div>
          {index < steps.length - 1 ? (
            <div aria-hidden className="case-study-flow-arrow">
              ↓
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function CaseStudyCover({ url, title }: { url: string; title: string }) {
  return (
    <figure className="case-study-cover">
      <div className="case-study-cover-frame">
        <Image
          alt={`${title} cover`}
          className="case-study-cover-image"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 720px"
          src={url}
          unoptimized
        />
      </div>
    </figure>
  )
}

export function ProjectCaseStudy({
  project,
  relatedProjects,
  expertiseTitlesBySlug = {},
  relatedKnowledge = null,
}: ProjectCaseStudyProps) {
  const metadataLine = buildProjectDetailMetadataLine(project)
  const approachSteps = parseStringArray(project.approach)
  const aiDesignGraph = parseArchitectureGraph(
    project.ai_design_nodes,
    project.ai_design_edges
  )
  const architectureGraph = parseArchitectureGraph(
    project.architecture_nodes,
    project.architecture_edges
  )
  const gallery = parseProjectGallery(project.gallery, project.demo_images)
  const problemScreenshot = firstGalleryItemOfType(gallery, "screenshot")
  const resultsDemo = firstGalleryItemOfType(gallery, "demo")
  const walkthroughItems = walkthroughGalleryItems(gallery)
  const metrics = parseProjectMetrics(project.metrics)
  const tradeoffs = parseProjectTradeoffs(project.tradeoffs)
  const contribution = parseStringArray(project.my_contribution)
  const techStackGroups = resolveTechStackDisplay(
    parseTechStackGroups(project.tech_stack_groups),
    project.tech_stack
  )
  const timeline = parseProjectTimeline(project.timeline)
  const results = parseStringArray(project.results)
  const learnings = parseStringArray(project.learnings)
  const keyTakeaways = parseStringArray(project.key_takeaways)
  const faqItems = parseFaqItems(project.faq)
  const projectFacts = parseProjectFacts(project.project_facts)
  const challenges = parseProjectChallenges(project.challenges)
  const contentDocument = deserializeContent(project.content)
  const showRichContent = hasRichContent(contentDocument)
  const coverImage = project.cover_image?.trim() || null
  const architectureImage = project.architecture_image?.trim() || null
  const demoVideoUrl = project.demo_video_url?.trim() || null
  const hasDemoVideo = Boolean(resolveVideoEmbed(demoVideoUrl))
  const showWalkthrough =
    walkthroughItems.length > 0 &&
    (walkthroughItems.length > 1 ||
      walkthroughItems[0]?.url !== problemScreenshot?.url)

  return (
    <article className="project-case-study">
      <ViewTracker
        event="project_view"
        payload={{ slug: project.slug, title: project.title }}
      />
      <header className="project-case-study-header">
        <PageBreadcrumbs currentLabel={project.title} />
        {metadataLine ? (
          <p className="project-case-study-meta">{metadataLine}</p>
        ) : null}
        <h1 className="project-case-study-title">{project.title}</h1>
        {project.tagline ? (
          <p className="project-case-study-tagline">{project.tagline}</p>
        ) : null}
        {project.overview ? (
          <div className="project-case-study-overview">
            <ProseParagraphs text={project.overview} />
          </div>
        ) : null}
        {project.ai_summary ? (
          <AiSummaryBlock summary={project.ai_summary} />
        ) : null}
        {project.expertise_slugs?.length ? (
          <ExpertiseBadges
            slugs={project.expertise_slugs}
            titlesBySlug={expertiseTitlesBySlug}
          />
        ) : null}
        {coverImage ? (
          <CaseStudyCover title={project.title} url={coverImage} />
        ) : null}
      </header>

      {Object.keys(projectFacts).length > 0 ? (
        <section className="project-case-study-facts-band">
          <ProjectFactsGrid facts={projectFacts} />
        </section>
      ) : null}

      {metrics.length > 0 ? (
        <section className="project-case-study-metrics-band">
          <MetricsGrid items={metrics} />
        </section>
      ) : null}

      <div className="project-case-study-sections">
        {project.problem ? (
          <CaseStudyBlock title="Problem">
            <ProseParagraphs text={project.problem} />
            {problemScreenshot ? (
              <CaseStudyFigure
                className="case-study-inline-figure"
                item={problemScreenshot}
                projectTitle={project.title}
              />
            ) : null}
          </CaseStudyBlock>
        ) : null}

        {project.why_built ? (
          <CaseStudyBlock title="Why I Built This">
            <ProseParagraphs text={project.why_built} />
          </CaseStudyBlock>
        ) : null}

        {approachSteps.length > 0 ? (
          <CaseStudyBlock title="Approach">
            <VerticalSteps steps={approachSteps} />
          </CaseStudyBlock>
        ) : null}

        {contribution.length > 0 ? (
          <CaseStudyBlock title="My Contribution">
            <BulletList items={contribution} />
          </CaseStudyBlock>
        ) : null}

        {hasArchitectureGraph(aiDesignGraph) ? (
          <CaseStudyBlock title="AI System Architecture">
            <ArchitectureDiagramLazy
              edges={aiDesignGraph.edges}
              nodes={aiDesignGraph.nodes}
            />
          </CaseStudyBlock>
        ) : null}

        {hasArchitectureGraph(architectureGraph) || architectureImage ? (
          <CaseStudyBlock title="System Architecture">
            {architectureImage ? (
              <CaseStudyFigure
                className="case-study-inline-figure case-study-inline-figure-architecture"
                item={{
                  url: architectureImage,
                  type: "diagram",
                  caption: "System architecture overview",
                  alt: `${project.title} architecture diagram`,
                }}
                projectTitle={project.title}
              />
            ) : null}
            {hasArchitectureGraph(architectureGraph) ? (
              <ArchitectureDiagramLazy
                edges={architectureGraph.edges}
                nodes={architectureGraph.nodes}
              />
            ) : null}
          </CaseStudyBlock>
        ) : null}

        {showWalkthrough ? (
          <CaseStudyBlock title="System Walkthrough">
            <CaseStudyCarousel
              items={walkthroughItems}
              projectTitle={project.title}
            />
          </CaseStudyBlock>
        ) : null}

        {techStackGroups.length > 0 ? (
          <CaseStudyBlock title="Tech Stack">
            <TechStackCategories groups={techStackGroups} />
          </CaseStudyBlock>
        ) : null}

        {challenges.length > 0 ? (
          <CaseStudyBlock title="Challenges">
            <ChallengeList items={challenges} />
          </CaseStudyBlock>
        ) : null}

        {tradeoffs.length > 0 ? (
          <CaseStudyBlock title="Engineering Tradeoffs">
            <TradeoffsList items={tradeoffs} />
          </CaseStudyBlock>
        ) : null}

        {results.length > 0 || hasDemoVideo || resultsDemo ? (
          <CaseStudyBlock title="Results">
            {hasDemoVideo && demoVideoUrl ? (
              <CaseStudyVideo title={project.title} url={demoVideoUrl} />
            ) : null}
            {resultsDemo && resultsDemo.url !== walkthroughItems[0]?.url ? (
              <CaseStudyFigure
                className="case-study-inline-figure"
                item={resultsDemo}
                projectTitle={project.title}
              />
            ) : null}
            <BulletList items={results} />
          </CaseStudyBlock>
        ) : null}

        {learnings.length > 0 ? (
          <CaseStudyBlock title="Key Learnings">
            <BulletList items={learnings} />
          </CaseStudyBlock>
        ) : null}

        {keyTakeaways.length > 0 ? (
          <CaseStudyBlock title="Key Takeaways">
            <KeyTakeawaysList items={keyTakeaways} title="" />
          </CaseStudyBlock>
        ) : null}

        {timeline.length > 0 ? (
          <CaseStudyBlock title="Timeline">
            <ProjectTimeline items={timeline} />
          </CaseStudyBlock>
        ) : null}
      </div>

      {showRichContent ? (
        <section className="project-case-study-rich-content">
          <RichContentRenderer document={contentDocument} />
        </section>
      ) : null}

      {(project.github_url || project.live_url) && (
        <div className="project-case-study-links">
          {project.github_url ? (
            <Link
              className="project-case-study-link"
              href={project.github_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </Link>
          ) : null}
          {project.live_url ? (
            <Link
              className="project-case-study-link"
              href={project.live_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Live demo
            </Link>
          ) : null}
        </div>
      )}

      {faqItems.length > 0 ? (
        <FaqSection items={faqItems} pageType="project" slug={project.slug} />
      ) : null}

      {relatedKnowledge ? (
        <div className="project-case-study-knowledge-related">
          <KnowledgeRelatedSection
            items={relatedKnowledge.research}
            title="Related Research"
          />
          <KnowledgeRelatedSection
            items={relatedKnowledge.writing}
            title="Related Articles"
          />
          <KnowledgeRelatedSection
            items={relatedKnowledge.automations}
            title="Related Automations"
          />
          <KnowledgeRelatedSection
            items={relatedKnowledge.concepts}
            title="Related Concepts"
          />
          <KnowledgeRelatedSection
            items={relatedKnowledge.technologies}
            title="Related Technologies"
          />
          <KnowledgeRelatedSection
            items={relatedKnowledge.expertise}
            title="Related Expertise"
          />
        </div>
      ) : null}

      <RelatedProjects projects={relatedProjects} />
    </article>
  )
}

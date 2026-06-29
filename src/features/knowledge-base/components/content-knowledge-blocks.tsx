import { AiSummaryBlock } from "@/features/ai-first/components/ai-summary-block"
import { FaqSection } from "@/features/home/components/faq-section"
import { ExpertiseBadges } from "@/features/knowledge-base/components/expertise-badges"
import { KnowledgeRelatedSection } from "@/features/knowledge-base/components/knowledge-related-section"
import type { ContentKnowledgeContext } from "@/features/portfolio/lib/content-knowledge"
import { KeyTakeawaysList } from "@/features/projects/components/key-takeaways-list"

type ContentKnowledgeBlocksProps = {
  context: ContentKnowledgeContext
}

type ContentKnowledgeAfterProps = ContentKnowledgeBlocksProps & {
  pageType?: "project" | "research" | "writing" | "automation"
  slug?: string
}

export function ContentKnowledgeBefore({
  context,
}: ContentKnowledgeBlocksProps) {
  return (
    <>
      {context.aiSummary ? (
        <AiSummaryBlock summary={context.aiSummary} />
      ) : null}
      <ExpertiseBadges
        slugs={context.expertiseSlugs}
        titlesBySlug={context.expertiseTitlesBySlug}
      />
    </>
  )
}

export function ContentKnowledgeAfter({
  context,
  pageType,
  slug,
}: ContentKnowledgeAfterProps) {
  const related = context.relatedKnowledge

  return (
    <div className="content-knowledge-after">
      <KeyTakeawaysList items={context.keyTakeaways} />
      <FaqSection items={context.faqItems} pageType={pageType} slug={slug} />
      {related ? (
        <>
          <KnowledgeRelatedSection
            items={related.expertise}
            title="Related Expertise"
          />
          <KnowledgeRelatedSection
            items={related.technologies}
            title="Related Technologies"
          />
          <KnowledgeRelatedSection
            items={related.concepts}
            title="Related Concepts"
          />
          <KnowledgeRelatedSection
            items={related.projects}
            title="Related Projects"
          />
          <KnowledgeRelatedSection
            items={related.research}
            title="Related Research"
          />
          <KnowledgeRelatedSection
            items={related.writing}
            title="Related Articles"
          />
          <KnowledgeRelatedSection
            items={related.automations}
            title="Related Automations"
          />
        </>
      ) : null}
    </div>
  )
}

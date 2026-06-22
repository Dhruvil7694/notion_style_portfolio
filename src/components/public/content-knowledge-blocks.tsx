import { AiSummaryBlock } from "@/components/public/ai-summary-block"
import { ExpertiseBadges } from "@/components/public/expertise-badges"
import { FaqSection } from "@/components/public/faq-section"
import { KeyTakeawaysList } from "@/components/public/key-takeaways-list"
import { KnowledgeRelatedSection } from "@/components/public/knowledge-related-section"
import type { ContentKnowledgeContext } from "@/lib/public/content-knowledge"

type ContentKnowledgeBlocksProps = {
  context: ContentKnowledgeContext
}

export function ContentKnowledgeBefore({ context }: ContentKnowledgeBlocksProps) {
  return (
    <>
      {context.aiSummary ? <AiSummaryBlock summary={context.aiSummary} /> : null}
      <ExpertiseBadges
        slugs={context.expertiseSlugs}
        titlesBySlug={context.expertiseTitlesBySlug}
      />
    </>
  )
}

export function ContentKnowledgeAfter({ context }: ContentKnowledgeBlocksProps) {
  const related = context.relatedKnowledge

  return (
    <div className="content-knowledge-after">
      <KeyTakeawaysList items={context.keyTakeaways} />
      <FaqSection items={context.faqItems} />
      {related ? (
        <>
          <KnowledgeRelatedSection items={related.expertise} title="Related Expertise" />
          <KnowledgeRelatedSection items={related.technologies} title="Related Technologies" />
          <KnowledgeRelatedSection items={related.concepts} title="Related Concepts" />
          <KnowledgeRelatedSection items={related.projects} title="Related Projects" />
          <KnowledgeRelatedSection items={related.research} title="Related Research" />
          <KnowledgeRelatedSection items={related.writing} title="Related Articles" />
          <KnowledgeRelatedSection items={related.automations} title="Related Automations" />
        </>
      ) : null}
    </div>
  )
}

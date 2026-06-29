import { BookOpen } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { AutomationList } from "@/features/automations/components/automation-list"
import { KbSection } from "@/features/knowledge-base/components/kb-section"
import { ResearchList } from "@/features/research/components/research-list"
import { WritingList } from "@/features/writing/components/writing-list"
import type { Content } from "@/shared/types/database.helpers"

type KnowledgeItem = Pick<
  Content,
  "slug" | "title" | "excerpt" | "published_at" | "tags"
>

type KnowledgeSectionProps = {
  research: KnowledgeItem[]
  writing: KnowledgeItem[]
  automations: KnowledgeItem[]
}

function KnowledgeSubsection({
  id,
  index,
  title,
  href,
  children,
  hasItems,
}: {
  id: string
  index: number
  title: string
  href: string
  children: ReactNode
  hasItems: boolean
}) {
  return (
    <div className="knowledge-subsection" id={id}>
      <div className="knowledge-subsection-header">
        <h3 className="knowledge-subsection-title">
          <span className="knowledge-subsection-index">{index}.</span>
          {title}
        </h3>
        <Link className="knowledge-subsection-more" href={href}>
          View all
        </Link>
      </div>
      {hasItems ? (
        children
      ) : (
        <p className="kb-empty-message">Nothing published yet.</p>
      )}
    </div>
  )
}

export function KnowledgeSection({
  research,
  writing,
  automations,
}: KnowledgeSectionProps) {
  return (
    <KbSection
      className="knowledge-section"
      icon={BookOpen}
      id="knowledge"
      title="Knowledge"
    >
      <div className="knowledge-subsections">
        <KnowledgeSubsection
          hasItems={research.length > 0}
          href="/research"
          id="research"
          index={1}
          title="Research"
        >
          <ResearchList items={research} />
        </KnowledgeSubsection>

        <KnowledgeSubsection
          hasItems={automations.length > 0}
          href="/automations"
          id="automations"
          index={2}
          title="Automation Systems"
        >
          <AutomationList items={automations} />
        </KnowledgeSubsection>

        <KnowledgeSubsection
          hasItems={writing.length > 0}
          href="/blog"
          id="writing"
          index={3}
          title="Writing"
        >
          <WritingList items={writing} />
        </KnowledgeSubsection>
      </div>
    </KbSection>
  )
}

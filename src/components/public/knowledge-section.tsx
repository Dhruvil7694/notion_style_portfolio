import { BookOpen } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { AutomationList } from "@/components/public/automation-list"
import { KbSection } from "@/components/public/kb-section"
import { ResearchList } from "@/components/public/research-list"
import { WritingList } from "@/components/public/writing-list"
import type { Content } from "@/types/database.helpers"

type KnowledgeItem = Pick<Content, "slug" | "title" | "excerpt" | "published_at" | "tags">

type KnowledgeSectionProps = {
  research: KnowledgeItem[]
  writing: KnowledgeItem[]
  automations: KnowledgeItem[]
}

function KnowledgeSubsection({
  id,
  title,
  href,
  children,
  hasItems,
}: {
  id: string
  title: string
  href: string
  children: ReactNode
  hasItems: boolean
}) {
  return (
    <div className="knowledge-subsection" id={id}>
      <div className="knowledge-subsection-header">
        <h3 className="knowledge-subsection-title">{title}</h3>
        <Link className="knowledge-subsection-more" href={href}>
          View all
        </Link>
      </div>
      {hasItems ? children : <p className="kb-empty-message">Nothing published yet.</p>}
    </div>
  )
}

export function KnowledgeSection({ research, writing, automations }: KnowledgeSectionProps) {
  return (
    <KbSection className="knowledge-section" icon={BookOpen} id="knowledge" title="Knowledge">
      <div className="knowledge-subsections">
        <KnowledgeSubsection hasItems={research.length > 0} href="/research" id="research" title="Research">
          <ResearchList items={research} />
        </KnowledgeSubsection>

        <KnowledgeSubsection hasItems={automations.length > 0} href="/automations" id="automations" title="Automation Systems">
          <AutomationList items={automations} />
        </KnowledgeSubsection>

        <KnowledgeSubsection hasItems={writing.length > 0} href="/blog" id="writing" title="Writing">
          <WritingList items={writing} />
        </KnowledgeSubsection>
      </div>
    </KbSection>
  )
}

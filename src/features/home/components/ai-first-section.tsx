import { Sparkles } from "lucide-react"
import Link from "next/link"

import { AiFirstKeywordsList } from "@/features/ai-first/components/ai-first-keywords-list"
import { KbSection } from "@/features/knowledge-base/components/kb-section"
import { AI_FIRST_SUMMARY_POINTS } from "@/features/portfolio/lib/ai-first-content"

export function AiFirstSection() {
  return (
    <KbSection
      className="ai-first-section"
      description="How I ship with agents, MCPs, and custom pipelines — built for SEO, GEO, and answer-engine discoverability."
      icon={Sparkles}
      id="ai-first"
      title="AI First Approach"
    >
      <div className="ai-first-content">
        <div className="ai-first-story">
          {AI_FIRST_SUMMARY_POINTS.map((point) => (
            <p className="ai-first-paragraph" key={point}>
              {point}
            </p>
          ))}
        </div>

        <AiFirstKeywordsList />

        <Link className="ai-first-more kb-section-link" href="/ai-first">
          Explore tools, workflows, and use cases
        </Link>
      </div>
    </KbSection>
  )
}

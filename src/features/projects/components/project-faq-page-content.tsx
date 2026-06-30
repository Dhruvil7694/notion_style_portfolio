import Link from "next/link"

import { FaqAccordionList } from "@/features/home/components/faq-accordion-list"
import { FaqPagination } from "@/features/knowledge-base/components/faq-pagination"
import type { FaqItem } from "@/features/knowledge-base/lib/schemas"
import { CaseStudyContentWidth } from "@/features/projects/components/case-study-content-width"
import { PageBreadcrumbs } from "@/features/site-shell/components/page-breadcrumbs"

type ProjectFaqPageContentProps = {
  currentPage: number
  faqItems: FaqItem[]
  projectSlug: string
  projectTitle: string
  totalPages: number
}

export function ProjectFaqPageContent({
  currentPage,
  faqItems,
  projectSlug,
  projectTitle,
  totalPages,
}: ProjectFaqPageContentProps) {
  return (
    <article className="project-faq-page">
      <CaseStudyContentWidth>
        <PageBreadcrumbs currentLabel="FAQ" />
        <header className="project-faq-page-header">
          <div className="knowledge-faq-header">
            <h1 className="project-faq-page-title">FAQ</h1>
            <Link
              className="knowledge-faq-view-all"
              href={`/projects/${projectSlug}`}
            >
              View case study
            </Link>
          </div>
          <p className="project-faq-page-subtitle">
            Questions and answers about {projectTitle}.
          </p>
        </header>

        <section className="knowledge-faq knowledge-faq--page">
          <div className="knowledge-faq-shell">
            <FaqAccordionList
              items={faqItems}
              pageType="project"
              slug={projectSlug}
            />
            <FaqPagination
              currentPage={currentPage}
              projectSlug={projectSlug}
              totalPages={totalPages}
            />
          </div>
        </section>
      </CaseStudyContentWidth>
    </article>
  )
}

"use client"

import { Icon } from "@iconify/react"
import { ChevronDown } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"

import { AiFirstKeywordsList } from "@/components/public/ai-first-keywords-list"
import {
  AI_FIRST_SUMMARY_POINTS,
  AI_FIRST_USE_CASES,
} from "@/lib/public/ai-first-content"

const AiFirstAutomationToolsTable = dynamic(
  () =>
    import("@/components/public/ai-first-automation-tools-table").then(
      (module) => ({
        default: module.AiFirstAutomationToolsTable,
      })
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="ai-first-tools-table-skeleton h-64 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
      />
    ),
  }
)

export function AiFirstPageContent() {
  return (
    <div className="ai-first-page">
      <section className="ai-first-page-intro">
        {AI_FIRST_SUMMARY_POINTS.map((point) => (
          <p className="ai-first-paragraph" key={point}>
            {point}
          </p>
        ))}
      </section>

      <AiFirstKeywordsList
        ariaLabel="AI-first topics"
        className="ai-first-keywords-page"
      />

      <AiFirstAutomationToolsTable />

      <div className="ai-first-use-cases">
        {AI_FIRST_USE_CASES.map((useCase) => (
          <details
            className="ai-first-use-case"
            id={useCase.id}
            key={useCase.id}
          >
            <summary className="ai-first-use-case-trigger">
              <span className="ai-first-use-case-trigger-text">
                <span className="ai-first-use-case-title">{useCase.title}</span>
                <span className="ai-first-use-case-problem">
                  {useCase.problem}
                </span>
              </span>
              <ChevronDown
                aria-hidden
                className="ai-first-use-case-chevron"
                strokeWidth={2}
              />
            </summary>

            <div className="ai-first-use-case-body">
              <p className="ai-first-use-case-approach">
                <span className="ai-first-use-case-label">Approach</span>
                {useCase.approach}
              </p>

              <div className="ai-first-tools">
                <h3 className="ai-first-tools-title">Tools & stack</h3>
                <ul className="ai-first-tools-list">
                  {useCase.tools.map((tool) => (
                    <li
                      className="ai-first-tool"
                      key={`${useCase.id}-${tool.name}`}
                    >
                      <div className="ai-first-tool-head">
                        <span className="ai-first-tool-name">
                          <Icon
                            aria-hidden
                            className="ai-first-tool-icon"
                            icon={tool.icon}
                          />
                          {tool.name}
                        </span>
                        <span className="ai-first-tool-role">{tool.role}</span>
                      </div>
                      <p className="ai-first-tool-description">
                        {tool.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ai-first-use-case-keywords">
                {useCase.keywords.map((keyword) => (
                  <span className="ai-first-use-case-tag" key={keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>

      <p className="ai-first-page-footer">
        Want a workflow mapped to your stack?{" "}
        <Link className="ai-first-page-contact" href="/contact">
          Get in touch
        </Link>
        .
      </p>
    </div>
  )
}

"use client"

import {
  ArrowLeftRight,
  BookOpen,
  Bot,
  Calendar,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Cpu,
  FileText,
  Images,
  Layers,
  Lightbulb,
  ListChecks,
  ListOrdered,
  type LucideIcon,
  Mountain,
  Package,
  TrendingUp,
  UserCheck,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"

const CASE_STUDY_BLOCK_ICONS = {
  aiArchitecture: Bot,
  approach: ListOrdered,
  challenges: Mountain,
  content: FileText,
  contribution: UserCheck,
  learnings: Lightbulb,
  problem: CircleAlert,
  research: BookOpen,
  results: TrendingUp,
  shipped: Package,
  systemArchitecture: Layers,
  takeaways: ListChecks,
  techStack: Cpu,
  timeline: Calendar,
  tradeoffs: ArrowLeftRight,
  walkthrough: Images,
  whyBuilt: CircleHelp,
} satisfies Record<string, LucideIcon>

export type CaseStudyBlockIconName = keyof typeof CASE_STUDY_BLOCK_ICONS

type CollapsibleCaseStudyBlockProps = {
  title: string
  icon: CaseStudyBlockIconName
  defaultOpen?: boolean
  fullWidthContent?: boolean
  children: React.ReactNode
}

type StaticCaseStudyBlockProps = {
  title: string
  icon: CaseStudyBlockIconName
  fullWidthContent?: boolean
  titleAction?: React.ReactNode
  blockRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}

export function StaticCaseStudyBlock({
  title,
  icon,
  fullWidthContent = false,
  titleAction,
  blockRef,
  children,
}: StaticCaseStudyBlockProps) {
  const Icon = CASE_STUDY_BLOCK_ICONS[icon]

  return (
    <section
      className={cn(
        "case-study-block case-study-block--static",
        fullWidthContent && "case-study-block--full-width-content"
      )}
      ref={blockRef}
    >
      <h2
        className={cn(
          "case-study-block-title-row",
          titleAction && "case-study-block-title-row--with-action"
        )}
      >
        <span className="case-study-block-heading">
          <Icon aria-hidden className="case-study-block-icon" />
          <span className="case-study-block-title">{title}</span>
        </span>
        {titleAction}
      </h2>
      <div className="case-study-block-body">{children}</div>
    </section>
  )
}

export function CollapsibleCaseStudyBlock({
  title,
  icon,
  defaultOpen = false,
  fullWidthContent = false,
  children,
}: CollapsibleCaseStudyBlockProps) {
  const Icon = CASE_STUDY_BLOCK_ICONS[icon]

  return (
    <Collapsible
      className={cn(
        "group case-study-block case-study-block--collapsible",
        fullWidthContent && "case-study-block--full-width-content"
      )}
      defaultOpen={defaultOpen}
    >
      <h2 className="case-study-block-title-row">
        <CollapsibleTrigger className="case-study-block-trigger">
          <Icon aria-hidden className="case-study-block-icon" />
          <span className="case-study-block-title">{title}</span>
          <ChevronDown
            aria-hidden
            className="case-study-block-chevron size-5 shrink-0"
          />
        </CollapsibleTrigger>
      </h2>
      <CollapsibleContent className="case-study-block-content overflow-hidden">
        <div className="case-study-block-body">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

import Link from "next/link"

import { ExperienceTechStack } from "@/features/experience/components/experience-tech-stack"
import {
  type ExperienceCaseStudy,
  hasExperienceCaseStudy,
  parseExperienceCaseStudy,
} from "@/features/portfolio/lib/experience-case-study"
import {
  formatExperienceDateRangeLabel,
  formatExperienceDurationCompact,
  getExperienceDurationMonths,
  isVolunteerExperience,
} from "@/features/portfolio/lib/experience-duration"
import {
  expandExperienceTechStack,
  groupExperienceTechStack,
} from "@/features/portfolio/lib/experience-tech-stack"
import { CaseStudyAccordion } from "@/features/projects/components/case-study-accordion"
import { CaseStudySection } from "@/features/projects/components/case-study-section"
import { PageBreadcrumbs } from "@/features/site-shell/components/page-breadcrumbs"
import type { Experience } from "@/shared/types/database.helpers"

type ExperienceArticleProps = {
  experience: Experience
}

export function ExperienceArticle({ experience }: ExperienceArticleProps) {
  const companyUrl = getCompanyUrl(experience.company)
  const duration = formatExperienceDurationCompact(
    getExperienceDurationMonths(experience)
  )
  const dateRange = formatExperienceDateRangeLabel(
    experience.start_date,
    experience.end_date
  )
  const volunteer = isVolunteerExperience(experience)
  const summary = buildFriendlySummary(experience)
  const expandedStack = expandExperienceTechStack(experience)
  const sections = buildStorySections(experience, expandedStack)

  return (
    <article className="experience-case-study">
      <header className="project-case-study-header">
        <PageBreadcrumbs currentLabel={experience.role} />
        <h1 className="project-case-study-title">{experience.role}</h1>
        <div className="experience-case-study-meta-row">
          <p className="experience-case-study-company">
            {companyUrl ? (
              <>
                <Link
                  className="experience-case-study-company-link"
                  href={companyUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {experience.company}
                </Link>
                {experience.location ? ` · ${experience.location}` : ""}
              </>
            ) : (
              <>
                {experience.company}
                {experience.location ? ` · ${experience.location}` : ""}
              </>
            )}
          </p>
          <p className="experience-case-study-duration">
            {dateRange}
            {" · "}
            {duration}
            {volunteer ? " · Volunteer" : null}
          </p>
        </div>
        <p className="project-case-study-summary">{summary}</p>
      </header>

      <div aria-hidden className="project-case-study-divider" />
      <CaseStudyAccordion defaultOpenIndex={0}>
        {sections.map((section, index) => (
          <CaseStudySection
            index={index}
            key={section.title}
            title={section.title}
          >
            {section.content}
          </CaseStudySection>
        ))}
      </CaseStudyAccordion>
    </article>
  )
}

function buildFriendlySummary(experience: Experience): string {
  const keywords = pickSeoKeywords(experience.tech_stack)
  const base = experience.description?.trim()

  if (!base) {
    return `I work on ${experience.role.toLowerCase()} projects, building AI systems, automation workflows, and reliable backend products that people can actually use.`
  }

  const plain = base.replace(/\s+/g, " ")
  const prefix = plain.endsWith(".") ? plain.slice(0, -1) : plain

  if (keywords.length === 0) {
    return `${prefix}. I focus on practical AI engineering and automation that solves real business problems.`
  }

  return `${prefix}. I mainly work with ${keywords.join(", ")} to ship useful AI products and workflow automation.`
}

function pickSeoKeywords(stack: string[]): string[] {
  const priority = [
    "AI systems",
    "automation",
    "NL-to-SQL",
    "RAG",
    "FastAPI",
    "PostgreSQL",
    "LangChain",
    "AWS",
    "Azure OpenAI",
    "machine learning",
  ]

  const haystack = stack.map((item) => item.toLowerCase())
  const matches = priority.filter((keyword) => {
    const check = keyword.toLowerCase()
    return haystack.some(
      (value) => value.includes(check) || check.includes(value)
    )
  })

  return matches.slice(0, 4)
}

function getCompanyUrl(company: string): string | null {
  const value = company.trim().toLowerCase()

  if (value.includes("1point1")) {
    return "https://www.1point1.com/"
  }

  return null
}

type Section = {
  title: string
  content: React.ReactNode
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

function LabeledGroup({ label, body }: { label: string; body: string[] }) {
  return (
    <div className="case-study-challenge">
      <p className="case-study-challenge-label">{label}</p>
      <BulletList items={body} />
    </div>
  )
}

function inferProjectName(text: string, index: number): string {
  if (/nl.?to.?sql/i.test(text)) return "NL→SQL Platform"
  if (/tender|document intelligence/i.test(text))
    return "Tender Intelligence System"
  if (/defect|computer vision|classification/i.test(text))
    return "CV Defect Detection"
  if (/pipeline/i.test(text)) return "Automation Pipeline"
  return `Project ${index + 1}`
}

function classifyAchievements(achievements: string[]) {
  const projects = achievements.filter((item) =>
    /(platform|system|pipeline|assistant|detection|workflows?|solution)/i.test(
      item
    )
  )
  const automation = achievements.filter((item) =>
    /(automated|automation|workflow|processing|pipeline|integration)/i.test(
      item
    )
  )
  const systems = achievements.filter((item) =>
    /(designed|built|deployed|architecture|scalable|runtime|api|platform|engineered)/i.test(
      item
    )
  )
  const challenges = achievements.filter((item) =>
    /(accuracy|concurrent|large|scale|guardrail|latency|anomaly|reduc|time|complex)/i.test(
      item
    )
  )
  const impact = achievements.filter((item) =>
    /(\d+%|\d[\d,+]*\+|under \d+|\d+ hours?)/i.test(item)
  )

  return { projects, automation, systems, challenges, impact }
}

function buildStorySections(
  experience: Experience,
  expandedStack: string[]
): Section[] {
  const caseStudy = parseExperienceCaseStudy(experience.case_study)
  if (caseStudy && hasExperienceCaseStudy(caseStudy)) {
    return buildSectionsFromCaseStudy(experience, expandedStack, caseStudy)
  }

  return buildSectionsFromAchievements(experience, expandedStack)
}

function buildSectionsFromCaseStudy(
  experience: Experience,
  expandedStack: string[],
  caseStudy: ExperienceCaseStudy
): Section[] {
  const summary =
    experience.description?.trim() ||
    "Worked across core engineering initiatives."
  const projects = caseStudy.projects ?? []

  const sections: Section[] = [
    {
      title: "What was I hired to solve?",
      content: (
        <>
          {caseStudy.hire_summary ? (
            <ProseParagraphs text={caseStudy.hire_summary} />
          ) : (
            <ProseParagraphs
              text={`${experience.role} at ${experience.company} focused on shipping production systems with end-to-end ownership.`}
            />
          )}
          <BulletList
            items={[
              ...(caseStudy.hire_scope?.length
                ? caseStudy.hire_scope.map((item) => `Scope: ${item}`)
                : [`Scope: ${summary}`]),
              ...(caseStudy.hire_ownership?.length
                ? caseStudy.hire_ownership.map((item) => `Ownership: ${item}`)
                : ["Ownership: architecture, implementation, and rollout"]),
              ...(caseStudy.hire_context?.length
                ? caseStudy.hire_context.map((item) => `Context: ${item}`)
                : [
                    "Context: high-impact business workflows and reliability requirements",
                  ]),
            ]}
          />
        </>
      ),
    },
    {
      title: "What business problems were we trying to solve?",
      content: (
        <BulletList
          items={
            caseStudy.business_problems?.length
              ? caseStudy.business_problems
              : [
                  "Business constraints and opportunity areas are being documented.",
                ]
          }
        />
      ),
    },
  ]

  if (projects.length > 0) {
    sections.push({
      title: "Projects I worked on",
      content: (
        <div className="experience-projects">
          {projects.map((project, index) => (
            <section
              className="experience-project"
              key={`${project.name}-${index}`}
            >
              <h3 className="experience-project-title">{project.name}</h3>
              <ul className="case-study-list">
                <li className="case-study-list-item">
                  <strong>Business problem:</strong> {project.business_problem}
                </li>
                <li className="case-study-list-item">
                  <strong>My contribution:</strong> {project.contribution}
                </li>
                <li className="case-study-list-item">
                  <strong>Technologies:</strong> {project.technologies}
                </li>
                <li className="case-study-list-item">
                  <strong>Outcome:</strong> {project.outcome}
                </li>
              </ul>
            </section>
          ))}
        </div>
      ),
    })
  }

  const challenge = caseStudy.hardest_challenge

  sections.push(
    {
      title: "Which manual processes did we automate?",
      content: (
        <BulletList
          items={
            caseStudy.automation?.length
              ? caseStudy.automation
              : [
                  "Reduced repeated manual effort through automation-first engineering workflows.",
                ]
          }
        />
      ),
    },
    {
      title: "Systems I designed or heavily contributed to",
      content: (
        <BulletList
          items={
            caseStudy.systems?.length
              ? caseStudy.systems
              : [
                  "Contributed to production-grade system design across data, API, and workflow layers.",
                ]
          }
        />
      ),
    },
    {
      title: "Hardest engineering challenge",
      content: (
        <div className="case-study-challenges">
          <LabeledGroup
            label="Challenge"
            body={
              challenge
                ? [challenge.challenge]
                : ["Production reliability under evolving requirements."]
            }
          />
          <LabeledGroup
            label="Constraints"
            body={
              challenge?.constraints ?? [
                "Production reliability and latency expectations",
                "Cross-team coordination and evolving requirements",
              ]
            }
          />
          <LabeledGroup
            label="Solution"
            body={
              challenge?.solution ?? [
                "Designed pragmatic architecture tradeoffs to balance quality, speed, and maintainability.",
              ]
            }
          />
          <LabeledGroup
            label="Outcome"
            body={
              challenge?.outcome ?? [
                "Shipped stable systems with measurable operational improvements.",
              ]
            }
          />
        </div>
      ),
    },
    {
      title: "Engineering decisions & tradeoffs",
      content: (
        <BulletList
          items={
            caseStudy.tradeoffs?.length
              ? caseStudy.tradeoffs
              : [
                  "Used retrieval-augmented workflows when explainability and updatable knowledge mattered more than model re-training.",
                  "Preferred relational storage for correctness, querying flexibility, and operational familiarity.",
                ]
          }
        />
      ),
    },
    {
      title: "So what did I actually learn?",
      content: (
        <BulletList
          items={
            caseStudy.learnings?.length
              ? caseStudy.learnings
              : [
                  "Business impact comes from system reliability and usability, not model novelty alone.",
                  "Clear ownership boundaries speed up delivery in multi-system initiatives.",
                ]
          }
        />
      ),
    },
    {
      title: "Impact",
      content: (
        <BulletList
          items={
            caseStudy.impact?.length
              ? caseStudy.impact
              : [
                  "Improved throughput across key workflows.",
                  "Reduced manual effort and processing time.",
                  "Increased delivery confidence with production-ready systems.",
                ]
          }
        />
      ),
    },
    {
      title: "Tech Stack",
      content: (
        <ExperienceTechStack groups={groupExperienceTechStack(expandedStack)} />
      ),
    }
  )

  return sections
}

function buildSectionsFromAchievements(
  experience: Experience,
  expandedStack: string[]
): Section[] {
  const summary =
    experience.description?.trim() ||
    "Worked across core engineering initiatives."
  const achievements = experience.achievements ?? []
  const { projects, automation, systems, challenges, impact } =
    classifyAchievements(achievements)

  const projectItems = (
    projects.length > 0 ? projects : achievements.slice(0, 3)
  ).map((item, index) => ({
    name: inferProjectName(item, index),
    businessProblem:
      "Manual or slow workflow was limiting business throughput.",
    contribution: item,
    technologies:
      expandedStack.slice(0, 5).join(" · ") || "Core platform stack",
    outcome: "Delivered measurable reliability and speed improvements.",
  }))

  const toughest = challenges[0] ?? achievements[0] ?? summary

  const sections: Section[] = [
    {
      title: "What was I hired to solve?",
      content: (
        <>
          <ProseParagraphs
            text={`${experience.role} at ${experience.company} focused on shipping production systems with end-to-end ownership.\n\nI handled solution design, implementation, and delivery while collaborating with cross-functional teams to align engineering execution with business goals.`}
          />
          <BulletList
            items={[
              `Scope: ${summary}`,
              "Ownership: architecture, implementation, and rollout",
              "Context: high-impact business workflows and reliability requirements",
            ]}
          />
        </>
      ),
    },
    {
      title: "What business problems were we trying to solve?",
      content: (
        <BulletList
          items={
            achievements.length > 0
              ? achievements
                  .slice(0, 4)
                  .map((item) => `Business pain point addressed by: ${item}`)
              : [
                  "Business constraints and opportunity areas are being documented.",
                ]
          }
        />
      ),
    },
  ]

  if (projectItems.length > 0) {
    sections.splice(2, 0, {
      title: "Projects I worked on",
      content: (
        <div className="experience-projects">
          {projectItems.map((project, index) => (
            <section
              className="experience-project"
              key={`${project.name}-${index}`}
            >
              <h3 className="experience-project-title">{project.name}</h3>
              <ul className="case-study-list">
                <li className="case-study-list-item">
                  <strong>Business problem:</strong> {project.businessProblem}
                </li>
                <li className="case-study-list-item">
                  <strong>My contribution:</strong> {project.contribution}
                </li>
                <li className="case-study-list-item">
                  <strong>Technologies:</strong> {project.technologies}
                </li>
                <li className="case-study-list-item">
                  <strong>Outcome:</strong> {project.outcome}
                </li>
              </ul>
            </section>
          ))}
        </div>
      ),
    })
  }

  sections.push(
    {
      title: "Which manual processes did we automate?",
      content: (
        <BulletList
          items={
            automation.length > 0
              ? automation
              : [
                  "Reduced repeated manual effort through automation-first engineering workflows.",
                ]
          }
        />
      ),
    },
    {
      title: "Systems I designed or heavily contributed to",
      content: (
        <BulletList
          items={
            systems.length > 0
              ? systems
              : [
                  "Contributed to production-grade system design across data, API, and workflow layers.",
                ]
          }
        />
      ),
    },
    {
      title: "Hardest engineering challenge",
      content: (
        <div className="case-study-challenges">
          <LabeledGroup label="Challenge" body={[toughest]} />
          <LabeledGroup
            label="Constraints"
            body={[
              "Production reliability and latency expectations",
              "Cross-team coordination and evolving requirements",
            ]}
          />
          <LabeledGroup
            label="Solution"
            body={[
              "Designed pragmatic architecture tradeoffs to balance quality, speed, and maintainability.",
            ]}
          />
          <LabeledGroup
            label="Outcome"
            body={[
              "Shipped stable systems with measurable operational improvements.",
            ]}
          />
        </div>
      ),
    },
    {
      title: "Engineering decisions & tradeoffs",
      content: (
        <BulletList
          items={[
            "Used retrieval-augmented workflows when explainability and updatable knowledge mattered more than model re-training.",
            "Preferred relational storage for correctness, querying flexibility, and operational familiarity.",
            "Adopted asynchronous/concurrent processing where throughput and responsiveness were critical.",
            "Used hybrid extraction approaches to improve reliability across semi-structured inputs.",
          ]}
        />
      ),
    },
    {
      title: "So what did I actually learn?",
      content: (
        <BulletList
          items={[
            "Business impact comes from system reliability and usability, not model novelty alone.",
            "Clear ownership boundaries speed up delivery in multi-system initiatives.",
            "Incremental architecture decisions compound into maintainable platforms.",
          ]}
        />
      ),
    },
    {
      title: "Impact",
      content: (
        <BulletList
          items={
            impact.length > 0
              ? impact
              : [
                  "Improved throughput across key workflows.",
                  "Reduced manual effort and processing time.",
                  "Increased delivery confidence with production-ready systems.",
                ]
          }
        />
      ),
    },
    {
      title: "Tech Stack",
      content: (
        <ExperienceTechStack groups={groupExperienceTechStack(expandedStack)} />
      ),
    }
  )

  return sections
}

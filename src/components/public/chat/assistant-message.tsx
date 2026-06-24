"use client"

import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileText,
  GitFork,
  Link,
  Mail,
  Maximize2,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import remarkGfm from "remark-gfm"

import type { EntityLink } from "@/components/public/chat/assistant-context"
import type { CitationBundle } from "@/lib/ai/citations/citation-types"
import { captureEvent } from "@/lib/analytics/posthog-client"
import { parseSeniorityFit } from "@/lib/public/job-seniority"
import { isJobFitAnalysisMessage } from "@/lib/public/parse-job-fit-result"
import { cn } from "@/lib/utils"

import { JobFitSeniorityVerdict } from "./job-fit-seniority-hint"
import { JobFitSkillChartFromMarkdown } from "./job-fit-skill-chart"

type AssistantMessageProps = {
  role: "user" | "assistant"
  content: string
  citations?: CitationBundle
  entityLinks?: EntityLink[]
  followups?: string[]
  isStreaming?: boolean
  timestamp?: number
  onFollowup?: (q: string) => void
}

// ── Relative timestamp ────────────────────────────────────────
function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return "just now"
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

// ── Tech docs map ─────────────────────────────────────────────
const TECH_DOCS: Record<string, string> = {
  langchain: "https://python.langchain.com",
  langgraph: "https://langchain-ai.github.io/langgraph",
  fastapi: "https://fastapi.tiangolo.com",
  postgresql: "https://www.postgresql.org/docs",
  qdrant: "https://qdrant.tech/documentation",
  faiss: "https://faiss.ai",
  docker: "https://docs.docker.com",
  python: "https://docs.python.org",
  redis: "https://redis.io/docs",
  mlflow: "https://mlflow.org/docs",
  aws: "https://docs.aws.amazon.com",
  azure: "https://learn.microsoft.com/en-us/azure",
  huggingface: "https://huggingface.co/docs",
  transformers: "https://huggingface.co/docs/transformers",
}

// ── Tech pill ─────────────────────────────────────────────────
function TechPill({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "")
  const href = TECH_DOCS[key]
  const inner = (
    <span className="tech-pill">
      {name}
      {href && <ExternalLink className="inline ml-0.5 size-2.5 opacity-50" />}
    </span>
  )
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        {inner}
      </a>
    )
  }
  return inner
}

// ── Skill pills extracted from content ───────────────────────
const SKILL_NAMES = [
  "RAG",
  "LangChain",
  "LangGraph",
  "FastAPI",
  "Python",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Azure",
  "MLflow",
  "Qdrant",
  "FAISS",
  "Redis",
  "LoRA",
  "QLoRA",
  "Transformers",
  "HuggingFace",
  "TensorFlow",
  "Multi-Agent",
  "LLM",
  "NLP",
  "SSE",
  "LLM Evaluation",
]

function extractSkills(content: string): string[] {
  return SKILL_NAMES.filter((s) =>
    new RegExp(`\\b${s.replace(/[-]/g, "[-]?")}\\b`, "i").test(content)
  ).slice(0, 8)
}

function SkillCloud({
  skills,
  onAsk,
}: {
  skills: string[]
  onAsk: (q: string) => void
}) {
  if (skills.length === 0) return null
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <button
          key={skill}
          className={cn(
            "rounded-md border border-border/50 bg-muted/30 px-2 py-0.5",
            "text-[11px] font-medium text-muted-foreground transition-all",
            "hover:border-border hover:bg-muted/60 hover:text-foreground",
            "active:scale-95"
          )}
          onClick={() =>
            onAsk(`Tell me more about Dhruvil's experience with ${skill}`)
          }
          title={`Ask about ${skill}`}
          type="button"
        >
          {skill}
        </button>
      ))}
    </div>
  )
}

// ── Contact action card ───────────────────────────────────────
const CONTACT_TRIGGER =
  /\bcontact\b|\breach out\b|\bemail\b|\bhire\b|\bget in touch\b/i

function ContactCard() {
  const [copied, setCopied] = useState(false)

  function copyEmail() {
    void navigator.clipboard.writeText("dhruvil7694@gmail.com")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "mt-2 rounded-xl border border-border/50 bg-muted/20 p-3",
        "flex flex-col gap-2"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
        Get in touch
      </p>
      <div className="flex items-center gap-2">
        {/* Email */}
        <button
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-2.5 py-2",
            "text-left transition-all hover:border-border hover:bg-muted/30",
            copied && "border-emerald-500/40 bg-emerald-500/5"
          )}
          onClick={copyEmail}
          type="button"
        >
          {copied ? (
            <Check className="size-3.5 shrink-0 text-emerald-500" />
          ) : (
            <Mail className="size-3.5 shrink-0 text-muted-foreground/60" />
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/80">
            {copied ? "Copied!" : "dhruvil7694@gmail.com"}
          </span>
          <Copy className="size-3 shrink-0 text-muted-foreground/30" />
        </button>

        {/* GitHub */}
        <a
          href="https://github.com/dhruvilpatel"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/40",
            "bg-background/60 text-muted-foreground/60 transition-all hover:border-border hover:text-foreground"
          )}
          title="GitHub"
        >
          <GitFork className="size-3.5" />
        </a>

        {/* LinkedIn */}
        <a
          href="https://linkedin.com/in/dhruvil-patel"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/40",
            "bg-background/60 text-muted-foreground/60 transition-all hover:border-border hover:text-foreground"
          )}
          title="LinkedIn"
        >
          <Link className="size-3.5" />
        </a>
      </div>
    </div>
  )
}

// ── Resume card ───────────────────────────────────────────────
const RESUME_TRIGGER = /\bresume\b|\bcv\b|download.*pdf|pdf.*download/i

function ResumeCard() {
  return (
    <a
      className={cn(
        "mt-2 flex items-center gap-3 rounded-xl border border-border/50",
        "bg-muted/20 px-3.5 py-2.5 transition-colors hover:border-border hover:bg-muted/40",
        "no-underline group"
      )}
      download="Dhruvil_Patel_Resume.pdf"
      href="/resume/dhruvil-patel.pdf"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.07] group-hover:bg-foreground/[0.11] transition-colors">
        <FileText className="size-4 text-foreground/70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-foreground">
          Dhruvil Patel — Resume
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          PDF · Applied AI Engineer
        </p>
      </div>
      <Download className="size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
    </a>
  )
}

// ── Citation source cards ─────────────────────────────────────
function SourceCard({
  item,
  type,
}: {
  item: { title: string; url: string }
  type: "project" | "expertise" | "technology" | "concept" | "source"
}) {
  const badge: Record<string, { label: string; cls: string }> = {
    project: {
      label: "Project",
      cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    expertise: {
      label: "Expertise",
      cls: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    technology: {
      label: "Tech",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    concept: {
      label: "Concept",
      cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    source: { label: "Source", cls: "bg-muted/60 text-muted-foreground" },
  }
  const { label, cls } = badge[type] ?? {
    label: type,
    cls: "bg-muted/60 text-muted-foreground",
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-2.5 py-1.5",
        "transition-colors hover:border-border/80 hover:bg-muted/30 no-underline group"
      )}
      onClick={() =>
        captureEvent("assistant_source_click", {
          sourceId: type,
          sourceTitle: item.title,
          sourceUrl: item.url,
        })
      }
    >
      <span
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
          cls
        )}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/80 group-hover:text-foreground">
        {item.title}
      </span>
      <ExternalLink className="size-2.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
    </a>
  )
}

function CitationsPanel({ citations }: { citations: CitationBundle }) {
  const cards = [
    ...citations.sources
      .slice(0, 3)
      .map((item) => ({ item, type: "source" as const })),
    ...citations.relatedProjects
      .slice(0, 3)
      .map((item) => ({ item, type: "project" as const })),
    ...citations.relatedExpertise
      .slice(0, 2)
      .map((item) => ({ item, type: "expertise" as const })),
    ...citations.relatedTechnologies
      .slice(0, 2)
      .map((item) => ({ item, type: "technology" as const })),
    ...citations.relatedConcepts
      .slice(0, 2)
      .map((item) => ({ item, type: "concept" as const })),
  ]
  if (cards.length === 0) return null
  return (
    <div className="mt-1.5 grid grid-cols-1 gap-1">
      {cards.map(({ item, type }) => (
        <SourceCard key={`${type}-${item.url}`} item={item} type={type} />
      ))}
    </div>
  )
}

function hasCitations(c: CitationBundle) {
  return (
    c.sources.length > 0 ||
    c.relatedProjects.length > 0 ||
    c.relatedTechnologies.length > 0 ||
    c.relatedExpertise.length > 0 ||
    c.relatedConcepts.length > 0
  )
}

// ── Follow-up chips ───────────────────────────────────────────
function FollowupChips({
  followups,
  onAsk,
}: {
  followups: string[]
  onAsk: (q: string) => void
}) {
  if (followups.length === 0) return null
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {followups.map((q) => (
        <button
          key={q}
          className={cn(
            "rounded-full border border-border/50 bg-background/60 px-2.5 py-1",
            "text-[11px] text-muted-foreground/70 transition-all",
            "hover:border-border hover:bg-muted/40 hover:text-foreground",
            "active:scale-95 text-left"
          )}
          onClick={() => onAsk(q)}
          type="button"
        >
          {q}
        </button>
      ))}
    </div>
  )
}

// ── Chart renderer ────────────────────────────────────────────
type ChartSpec = {
  type: "bar" | "line" | "pie" | "radar"
  title?: string
  data: Array<Record<string, string | number>>
  xKey?: string
  yKey?: string
  colors?: string[]
}

const CHART_COLORS = [
  "var(--foreground)",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
]

function ChartInner({ spec, height }: { spec: ChartSpec; height: number }) {
  const { type, data, xKey, yKey, colors = CHART_COLORS } = spec
  const x = xKey ?? Object.keys(data[0] ?? {})[0] ?? "name"
  const y = yKey ?? Object.keys(data[0] ?? {})[1] ?? "value"
  const tooltipStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
    borderRadius: "8px",
    fontSize: "11px",
    color: "var(--foreground)",
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "bar" ? (
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="color-mix(in srgb, var(--border) 40%, transparent)"
          />
          <XAxis
            dataKey={x}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            interval={0}
          />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey={y} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={colors[i % colors.length]}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      ) : type === "line" ? (
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="color-mix(in srgb, var(--border) 40%, transparent)"
          />
          <XAxis
            dataKey={x}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            dataKey={y}
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ r: 3, fill: colors[0] }}
          />
        </LineChart>
      ) : type === "radar" ? (
        <RadarChart data={data} cx="50%" cy="50%">
          <PolarGrid stroke="color-mix(in srgb, var(--border) 40%, transparent)" />
          <PolarAngleAxis
            dataKey={x}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Radar
            dataKey={y}
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      ) : (
        <PieChart>
          <Pie
            data={data}
            dataKey={y}
            nameKey={x}
            cx="50%"
            cy="50%"
            outerRadius={height * 0.32}
            label={({ name, percent }) =>
              `${String(name).split(" ")[0]} ${Math.round((percent ?? 0) * 100)}%`
            }
            labelLine
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={colors[i % colors.length]}
                fillOpacity={0.85}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
        </PieChart>
      )}
    </ResponsiveContainer>
  )
}

function ChatChart({ spec }: { spec: ChartSpec }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      {/* Inline chart */}
      <div className="relative my-3 rounded-xl border border-border/40 bg-muted/10 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          {spec.title && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {spec.title}
            </p>
          )}
          <button
            className="ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-muted/40 hover:text-muted-foreground"
            onClick={() => setExpanded(true)}
            title="Expand chart"
            type="button"
          >
            <Maximize2 className="size-3" />
          </button>
        </div>
        <ChartInner spec={spec} height={180} />
      </div>

      {/* Fullscreen modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-border/60 bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              {spec.title && (
                <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {spec.title}
                </p>
              )}
              <button
                className="ml-auto flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setExpanded(false)}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <ChartInner spec={spec} height={360} />
          </div>
        </div>
      )}
    </>
  )
}

function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const parsed = JSON.parse(raw) as ChartSpec
    if (!parsed.type || !Array.isArray(parsed.data) || parsed.data.length === 0)
      return null
    return parsed
  } catch {
    return null
  }
}

// ── Custom markdown renderers ─────────────────────────────────
const markdownComponents: Components = {
  a({ href, children }) {
    const isPortfolio =
      !href ||
      href.startsWith("/") ||
      (typeof window !== "undefined" && href.startsWith(window.location.origin))
    if (isPortfolio) {
      return (
        <a href={href} className="chat-link-inline">
          {children}
        </a>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="chat-link"
      >
        {children}
        <ExternalLink className="inline ml-0.5 size-2.5 opacity-60 align-middle" />
      </a>
    )
  },
  code({ children, className }) {
    const lang = className?.replace("language-", "") ?? ""
    if (lang === "chart") {
      const spec = parseChartSpec(String(children).trim())
      if (spec) return <ChatChart spec={spec} />
    }
    const isBlock = Boolean(className)
    if (isBlock) return <code className={className}>{children}</code>
    const text = String(children).trim()
    if (text.length < 32 && /^[\w.\-/]+$/.test(text))
      return <TechPill name={text} />
    return <code>{children}</code>
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>
  },
  ul({ children }) {
    return <ul className="chat-list-ul">{children}</ul>
  },
  ol({ children }) {
    return <ol className="chat-list-ol">{children}</ol>
  },
  li({ children }) {
    return <li className="chat-list-item">{children}</li>
  },
  blockquote({ children }) {
    return <div className="chat-callout">{children}</div>
  },
  hr() {
    return <div className="chat-divider" />
  },
  h1({ children }) {
    return <h1 className="chat-h1">{children}</h1>
  },
  h2({ children }) {
    return <h2 className="chat-h2">{children}</h2>
  },
  h3({ children }) {
    return <h3 className="chat-h3">{children}</h3>
  },
  table({ children }) {
    return (
      <div className="chat-table-wrap">
        <table className="chat-table">{children}</table>
      </div>
    )
  },
  thead({ children }) {
    return <thead className="chat-thead">{children}</thead>
  },
  th({ children }) {
    return <th className="chat-th">{children}</th>
  },
  td({ children }) {
    return <td className="chat-td">{children}</td>
  },
}

// ── Copy button ───────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      aria-label="Copy message"
      className={cn(
        "flex size-6 items-center justify-center rounded-md transition-all",
        "text-muted-foreground/30 hover:bg-muted/40 hover:text-muted-foreground",
        copied && "text-emerald-500 hover:text-emerald-500"
      )}
      onClick={copy}
      title="Copy"
      type="button"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  )
}

// ── Timestamp ─────────────────────────────────────────────────
function Timestamp({ ts }: { ts: number }) {
  const [label, setLabel] = useState(() => relativeTime(ts))

  // refresh every 30s so "just now" → "30s ago" etc.
  useEffect(() => {
    setLabel(relativeTime(ts))
    const id = setInterval(() => setLabel(relativeTime(ts)), 30_000)
    return () => clearInterval(id)
  }, [ts])

  return (
    <span className="text-[10px] text-muted-foreground/30 tabular-nums">
      {label}
    </span>
  )
}

// ── Auto-link citation titles in markdown text ────────────────
function toRelative(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search + u.hash
  } catch {
    return url
  }
}

function linkifyCitations(
  text: string,
  citations?: CitationBundle,
  entityLinks?: EntityLink[]
): string {
  // Build entity pool: static entity map (all portfolio content) + citation entities
  const seen = new Set<string>()
  const entities: { title: string; url: string }[] = []

  // Only linkify project titles — specific enough to not cause false matches
  // Expertise/concept titles are too generic ("Multi-Agent Systems", "LLM Engineering")
  for (const e of entityLinks ?? []) {
    if (
      e.path.startsWith("/projects/") &&
      e.title.length >= 6 &&
      !seen.has(e.title)
    ) {
      seen.add(e.title)
      entities.push({ title: e.title, url: e.path })
    }
  }

  // Citation project entities supplement
  if (citations) {
    for (const e of citations.relatedProjects) {
      if (e.title && e.url && e.title.length >= 6 && !seen.has(e.title)) {
        seen.add(e.title)
        entities.push({ title: e.title, url: toRelative(e.url) })
      }
    }
  }

  if (entities.length === 0) return text

  // longest first — prevents partial matches eating longer titles
  entities.sort((a, b) => b.title.length - a.title.length)

  let result = text
  for (const { title, url } of entities) {
    if (result.includes("[" + title + "](")) continue
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const pattern = new RegExp("\\b(" + escaped + ")\\b", "g")
    let replaced = false
    result = result.replace(pattern, (match) => {
      if (replaced) return match
      replaced = true
      return "[" + match + "](" + url + ")"
    })
  }

  return result
}

// ── Main component ────────────────────────────────────────────
export function AssistantMessage({
  role,
  content,
  citations,
  entityLinks,
  followups,
  isStreaming,
  timestamp,
  onFollowup,
}: AssistantMessageProps) {
  const isUser = role === "user"
  const [citationsOpen, setCitationsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  // linkify after streaming done — avoids mid-stream regex churn
  const renderedContent =
    !isUser && !isStreaming
      ? linkifyCitations(content, citations, entityLinks)
      : content

  const showCitations =
    !isUser && !isStreaming && citations && hasCitations(citations)
  const showResume = !isUser && !isStreaming && RESUME_TRIGGER.test(content)
  const showContact = !isUser && !isStreaming && CONTACT_TRIGGER.test(content)
  const showFollowups =
    !isUser && !isStreaming && Boolean(followups?.length) && Boolean(onFollowup)
  const skills = !isUser && !isStreaming ? extractSkills(content) : []
  const showJobFitChart =
    !isUser && !isStreaming && isJobFitAnalysisMessage(content)
  const seniorityFit = showJobFitChart ? parseSeniorityFit(content) : null

  return (
    <div
      className={cn(
        "group flex gap-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="min-w-0 max-w-[88%]">
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed max-md:text-xs max-md:leading-relaxed",
            isUser
              ? "bg-foreground text-background"
              : "border border-border/50 bg-muted/30 text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="assistant-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {renderedContent}
              </ReactMarkdown>
              {seniorityFit ? (
                <JobFitSeniorityVerdict
                  className="mt-3"
                  compact
                  seniority={seniorityFit}
                />
              ) : null}
              {showJobFitChart ? (
                <JobFitSkillChartFromMarkdown
                  className="mt-3 border-t border-border/30 pt-3"
                  markdown={content}
                  variant="compact"
                />
              ) : null}
              {isStreaming && (
                <span className="ml-0.5 inline-block h-[14px] w-0.5 animate-pulse bg-muted-foreground/60" />
              )}
            </div>
          )}

          {/* Skill cloud — inside bubble */}
          {skills.length > 0 && onFollowup && (
            <SkillCloud skills={skills} onAsk={onFollowup} />
          )}

          {/* Citations */}
          {showCitations && (
            <div className="mt-2.5">
              <button
                className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
                onClick={() => setCitationsOpen((o) => !o)}
                type="button"
              >
                Sources
                {citations.confidence ? ` · ${citations.confidence}` : ""}
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform duration-200",
                    citationsOpen && "rotate-180"
                  )}
                />
              </button>
              {citationsOpen && (
                <div className="mt-2 border-t border-border/30 pt-2">
                  <CitationsPanel citations={citations} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resume card */}
        {showResume && <ResumeCard />}

        {/* Contact card */}
        {showContact && <ContactCard />}

        {/* Follow-up chips */}
        {showFollowups && (
          <FollowupChips followups={followups!} onAsk={onFollowup!} />
        )}

        {/* Timestamp row */}
        {timestamp && (
          <div
            className={cn(
              "assistant-message-meta mt-1 flex items-center gap-1.5 transition-opacity duration-200",
              isUser ? "justify-end" : "justify-start",
              hovered ? "opacity-100" : "opacity-0"
            )}
          >
            {!isUser && !isStreaming && <CopyButton text={content} />}
            <Timestamp ts={timestamp} />
          </div>
        )}
      </div>
    </div>
  )
}

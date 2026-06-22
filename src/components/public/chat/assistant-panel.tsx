"use client"

import { Briefcase, ChevronDown, Maximize2, Minimize2, SquarePen, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { glassPanelClass } from "@/lib/public/glass-panel"
import { cn } from "@/lib/utils"

import { useAssistant } from "./assistant-context"
import { AssistantInput } from "./assistant-input"
import { AssistantMessage } from "./assistant-message"
import { AssistantSuggestions } from "./assistant-suggestions"
import { JobFitNotifyCard } from "./job-fit-notify-card"

// ── Loading phase indicator ───────────────────────────────────
const LOADING_PHASES = [
  { label: "Searching portfolio…", ms: 0 },
  { label: "Reading context…", ms: 1400 },
  { label: "Thinking…", ms: 2800 },
]

function LoadingIndicator() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = LOADING_PHASES.slice(1).map((p, i) =>
      setTimeout(() => setPhase(i + 1), p.ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex items-center gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:120ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:240ms]" />
      </div>
      <span
        key={phase}
        className="animate-in fade-in slide-in-from-left-1 text-[11px] text-muted-foreground/50 duration-300"
      >
        {LOADING_PHASES[phase]?.label}
      </span>
    </div>
  )
}

// ── Job fit card ──────────────────────────────────────────────
function JobFitCard({ onSubmit }: { onSubmit: (jd: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [jd, setJd] = useState("")

  if (!expanded) {
    return (
      <button
        className={cn(
          "mx-4 mb-3 flex w-[calc(100%-2rem)] items-center gap-2.5 rounded-xl border border-dashed",
          "border-border/60 bg-muted/10 px-3.5 py-3 text-left transition-colors",
          "hover:border-border hover:bg-muted/20"
        )}
        onClick={() => setExpanded(true)}
        type="button"
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]">
          <Briefcase className="size-3.5 text-foreground/60" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-foreground/80">Check Job Fit</p>
          <p className="text-[11px] text-muted-foreground/60">
            Paste a JD — get a match score &amp; breakdown
          </p>
        </div>
      </button>
    )
  }

  return (
    <div className="mx-4 mb-3 flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="size-3.5 text-foreground/60" />
          <p className="text-[12px] font-medium text-foreground/80">Job Description</p>
        </div>
        <button
          className="text-muted-foreground/40 hover:text-muted-foreground"
          onClick={() => { setExpanded(false); setJd("") }}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <textarea
        autoFocus
        className={cn(
          "min-h-[80px] w-full resize-none rounded-lg border border-border/40 bg-background",
          "px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40",
          "focus:border-border/70 focus:outline-none"
        )}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the job description here…"
        value={jd}
      />
      <button
        className={cn(
          "w-full rounded-lg py-2 text-[12px] font-medium transition-all",
          jd.trim()
            ? "bg-foreground text-background hover:opacity-80"
            : "cursor-not-allowed bg-muted/40 text-muted-foreground/40"
        )}
        disabled={!jd.trim()}
        onClick={() => {
          onSubmit(`Analyse my job fit for this role:\n\n${jd.trim()}`)
          setExpanded(false)
          setJd("")
        }}
        type="button"
      >
        Analyse Fit
      </button>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────
export function AssistantPanel() {
  const {
    open, close, newChat,
    messages, suggestions, entityLinks, placeholderText, lastJdText,
    input, setInput, submit, submitQuestion, isLoading,
  } = useAssistant()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  // auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom || isLoading) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isLoading])

  // show scroll-to-bottom button when scrolled up
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(distFromBottom > 80)
    }
    el.addEventListener("scroll", check, { passive: true })
    return () => el.removeEventListener("scroll", check)
  }, [])

  if (!open) return null

  const isEmpty = messages.length === 0

  return (
    <div
      aria-label="Portfolio assistant"
      className={cn(
        "flex shrink-0 flex-col self-center overflow-hidden",
        "rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
        glassPanelClass,
        "transition-all duration-300 ease-in-out",
        expanded
          ? "h-[min(780px,calc(100vh-3rem))] w-[min(640px,calc(100vw-2rem))]"
          : "h-[min(600px,calc(100vh-5rem))] w-[min(420px,calc(100vw-2rem))]"
      )}
      role="dialog"
    >
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-semibold tracking-tight text-foreground">
            Portfolio Assistant
          </p>
          <p className="text-[11px] text-muted-foreground/60">Ask about Dhruvil&apos;s work</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            aria-label="New chat"
            className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            onClick={newChat}
            title="New chat"
            type="button"
          >
            <SquarePen className="size-3.5" />
          </button>
          <button
            aria-label={expanded ? "Collapse" : "Expand"}
            className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Collapse" : "Expand"}
            type="button"
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            aria-label="Close assistant"
            className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-red-500/15 hover:text-red-500"
            onClick={close}
            title="Close"
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </header>

      <div className="mx-4 h-px shrink-0 bg-border/40" />

      {/* Messages — scroll area */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="h-full space-y-3 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onWheel={(e) => { e.stopPropagation(); e.currentTarget.scrollTop += e.deltaY }}
        >
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1
            const isStreaming = isLoading && isLast && message.role === "assistant"
            const isJobFitResponse =
              isLast && !isLoading && message.role === "assistant" &&
              /##\s*Fit Analysis:/i.test(message.content) &&
              /Overall Fit Score/i.test(message.content) &&
              Boolean(lastJdText)

            return (
              <div key={message.id}>
                <AssistantMessage
                  citations={message.citations}
                  content={message.content}
                  entityLinks={entityLinks}
                  followups={message.followups}
                  isStreaming={isStreaming}
                  onFollowup={submitQuestion}
                  role={message.role}
                  timestamp={message.timestamp}
                />
                {isJobFitResponse && lastJdText && (
                  <JobFitNotifyCard fitAnalysis={message.content} jdText={lastJdText} />
                )}
              </div>
            )
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <LoadingIndicator />
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            aria-label="Scroll to bottom"
            className={cn(
              "absolute bottom-3 right-3 z-10",
              "flex size-7 items-center justify-center rounded-full",
              "border border-border/60 bg-background/90 shadow-sm backdrop-blur-sm",
              "text-muted-foreground/60 transition-all hover:border-border hover:text-foreground",
              "animate-in fade-in zoom-in-90 duration-150"
            )}
            onClick={() => {
              const el = scrollRef.current
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
            }}
            type="button"
          >
            <ChevronDown className="size-3.5" />
          </button>
        )}
      </div>

      {isEmpty && (
        <>
          <JobFitCard onSubmit={submitQuestion} />
          <AssistantSuggestions
            disabled={isLoading}
            onSelect={submitQuestion}
            suggestions={suggestions}
          />
        </>
      )}

      <div className="mx-4 h-px shrink-0 bg-border/40" />

      <AssistantInput
        disabled={isLoading}
        onChange={setInput}
        onSubmit={submit}
        placeholder={placeholderText}
        value={input}
      />
    </div>
  )
}

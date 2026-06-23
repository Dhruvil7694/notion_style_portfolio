"use client"

import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  FilePlus2,
  ListPlus,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { formatAssistantLoadingLabel } from "@/lib/public/assistant-loading-label"
import { glassPanelClass } from "@/lib/public/glass-panel"
import { cn } from "@/lib/utils"
import { trapNestedScrollWheel } from "@/lib/utils/trap-nested-scroll-wheel"

import { useAssistant } from "./assistant-context"
import { AssistantInput } from "./assistant-input"
import { AssistantMessage } from "./assistant-message"
import { AssistantSuggestions } from "./assistant-suggestions"
import { JobFitCard } from "./job-fit-card"
import { JobFitContactCard } from "./job-fit-contact-card"
import { JobFitExportPdfButton } from "./job-fit-export-pdf-button"
import { JobFitHistoryPanel } from "./job-fit-history-panel"

function buildLoadingPhases(question: string) {
  return [
    { label: formatAssistantLoadingLabel(question), ms: 0 },
    { label: "Reading context…", ms: 1400 },
    { label: "Thinking…", ms: 2800 },
  ]
}

function LoadingIndicator({ question }: { question: string }) {
  const phases = useMemo(() => buildLoadingPhases(question), [question])
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    setPhase(0)
    const timers = phases
      .slice(1)
      .map((p, i) => setTimeout(() => setPhase(i + 1), p.ms))
    return () => timers.forEach(clearTimeout)
  }, [phases])

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
        {phases[phase]?.label}
      </span>
    </div>
  )
}

function getLastUserQuestion(
  messages: { role: "user" | "assistant"; content: string }[]
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return messages[i]?.content ?? ""
  }
  return ""
}

export function AssistantPanel() {
  const {
    open,
    close,
    newChat,
    chatMode,
    startJobFitMode,
    startGeneralChat,
    messages,
    suggestions,
    entityLinks,
    placeholderText,
    lastJdText,
    calendlyUrl,
    jobFitHistory,
    input,
    setInput,
    submit,
    submitQuestion,
    submitJobFit,
    prepareAnotherJobFit,
    removeJobFitHistoryEntry,
    clearJobFitHistory,
    isLoading,
    stop,
  } = useAssistant()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const isJobFitMode = chatMode === "job-fit"
  const hasJobFitResult =
    isJobFitMode &&
    messages.some(
      (m) =>
        m.role === "assistant" &&
        /##\s*Fit Analysis:/i.test(m.content) &&
        /Overall Fit Score/i.test(m.content)
    )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom || isLoading) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isLoading])

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
  const lastMessage = messages[messages.length - 1]
  const lastUserQuestion = getLastUserQuestion(messages)
  const isAwaitingStreamContent =
    isLoading &&
    lastMessage?.role === "assistant" &&
    !lastMessage.content.trim()
  const showLoadingIndicator =
    isLoading && (lastMessage?.role === "user" || isAwaitingStreamContent)

  return (
    <div
      aria-label={isJobFitMode ? "Job fit checker" : "Portfolio assistant"}
      className={cn(
        "flex shrink-0 flex-col self-center overflow-hidden",
        "rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
        glassPanelClass,
        "transition-all duration-300 ease-in-out",
        expanded
          ? "h-[min(780px,calc(100vh-3rem))] w-[min(640px,calc(100vw-2rem))]"
          : "h-[min(600px,calc(100vh-5rem))] w-[min(420px,calc(100vw-2rem))]"
      )}
      data-lenis-prevent
      role="dialog"
    >
      <header className="flex shrink-0 items-center justify-between px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold tracking-tight text-foreground">
              {isJobFitMode ? "Job Fit Check" : "Portfolio Assistant"}
            </p>
            {isJobFitMode && (
              <span className="rounded-full bg-foreground/[0.07] px-2 py-0.5 text-[10px] font-medium text-foreground/60">
                JD mode
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            {isJobFitMode
              ? "Upload or paste a job description to analyse fit"
              : "Ask about Dhruvil's work"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {!isJobFitMode && (
            <button
              aria-label="Job fit check"
              className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
              onClick={startJobFitMode}
              title="Check job fit"
              type="button"
            >
              <Briefcase className="size-3.5" />
            </button>
          )}
          {isJobFitMode ? (
            <>
              <button
                aria-label="New job fit check"
                className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                onClick={startJobFitMode}
                title="New job fit check"
                type="button"
              >
                <FilePlus2 className="size-3.5" />
              </button>
              <button
                aria-label="Back to portfolio assistant"
                className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                onClick={startGeneralChat}
                title="Back to assistant"
                type="button"
              >
                <ArrowLeft className="size-3.5" />
              </button>
            </>
          ) : (
            <button
              aria-label="New chat"
              className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
              onClick={newChat}
              title="New chat"
              type="button"
            >
              <MessageSquarePlus className="size-3.5" />
            </button>
          )}
          <button
            aria-label={expanded ? "Collapse" : "Expand"}
            className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Collapse" : "Expand"}
            type="button"
          >
            {expanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
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

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="assistant-panel-scroll h-full space-y-3 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-lenis-prevent
          onWheel={trapNestedScrollWheel}
        >
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1
            const isStreaming =
              isLoading && isLast && message.role === "assistant"
            const isJobFitResponse =
              isLast &&
              !isLoading &&
              message.role === "assistant" &&
              /##\s*Fit Analysis:/i.test(message.content) &&
              /Overall Fit Score/i.test(message.content) &&
              Boolean(lastJdText)

            if (
              isLast &&
              message.role === "assistant" &&
              !message.content.trim() &&
              isLoading
            ) {
              return null
            }

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
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <JobFitExportPdfButton
                        analysisMarkdown={message.content}
                      />
                    </div>
                    <JobFitContactCard
                      calendlyUrl={calendlyUrl}
                      fitAnalysis={message.content}
                      jdText={lastJdText}
                    />
                  </>
                )}
              </div>
            )
          })}

          {showLoadingIndicator && (
            <LoadingIndicator question={lastUserQuestion} />
          )}
        </div>

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

      {isJobFitMode ? (
        <div
          className="assistant-panel-footer max-h-[min(42vh,320px)] shrink-0 overflow-y-auto overscroll-contain border-t border-border/30 p-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-lenis-prevent
          onWheel={trapNestedScrollWheel}
        >
          {(jobFitHistory?.length ?? 0) > 0 ? (
            <JobFitHistoryPanel
              entries={jobFitHistory ?? []}
              onClearAll={clearJobFitHistory}
              onRemoveEntry={removeJobFitHistoryEntry}
            />
          ) : null}
          {hasJobFitResult && !isLoading ? (
            <button
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed",
                "border-border/60 py-2.5 text-[12px] font-medium text-foreground/80",
                "transition-colors hover:border-border hover:bg-muted/20"
              )}
              onClick={prepareAnotherJobFit}
              type="button"
            >
              <ListPlus className="size-3.5" />
              Check another role
            </button>
          ) : null}
          {!hasJobFitResult && (
            <JobFitCard
              compact
              disabled={isLoading}
              isAnalysing={isLoading}
              onAnalyse={submitJobFit}
              onStop={stop}
              sessionHistory={jobFitHistory ?? []}
            />
          )}
        </div>
      ) : (
        <>
          {isEmpty && (
            <AssistantSuggestions
              disabled={isLoading}
              onSelect={submitQuestion}
              suggestions={suggestions}
            />
          )}

          <div className="mx-4 h-px shrink-0 bg-border/40" />

          <AssistantInput
            disabled={isLoading}
            isLoading={isLoading}
            onChange={setInput}
            onStop={stop}
            onSubmit={submit}
            placeholder={placeholderText}
            value={input}
          />
        </>
      )}
    </div>
  )
}

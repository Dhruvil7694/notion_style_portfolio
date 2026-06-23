"use client"

import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
  XCircle,
} from "lucide-react"
import { useState } from "react"

import { ContactLink } from "@/components/public/contact-link"
import {
  JOB_FIT_SCHEDULE_CALL_MIN_SCORE,
  shouldShowJobFitScheduleCta,
} from "@/lib/public/job-fit-schedule"
import { parseJobFitAnalysis } from "@/lib/public/parse-job-fit-result"
import { cn } from "@/lib/utils"

type JobFitContactCardProps = {
  fitAnalysis: string
  jdText: string
  calendlyUrl: string | null
  className?: string
}

type NotifyStep = "prompt" | "note" | "sending" | "done" | "error"

export function JobFitContactCard({
  fitAnalysis,
  jdText,
  calendlyUrl,
  className,
}: JobFitContactCardProps) {
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [notifyStep, setNotifyStep] = useState<NotifyStep>("prompt")
  const [note, setNote] = useState("")

  const parsed = parseJobFitAnalysis(fitAnalysis)
  const calendly = calendlyUrl?.trim() ?? ""
  const showSchedule =
    parsed && shouldShowJobFitScheduleCta(parsed.fitScore, calendly)

  if (dismissed || !parsed) return null

  async function sendNotification() {
    setNotifyStep("sending")
    try {
      const res = await fetch("/api/notify-employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: parsed?.roleTitle,
          jdText,
          fitAnalysis,
          fitScore: parsed?.fitScoreLabel,
          employerNote: note.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setNotifyStep("done")
    } catch {
      setNotifyStep("error")
    }
  }

  const headerSubtitle = collapsed
    ? `${parsed.fitScoreLabel} fit · ${parsed.roleTitle}`
    : showSchedule
      ? "Schedule a call or notify Dhruvil"
      : "Notify Dhruvil about this role"

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border border-border/50 bg-muted/20 p-3.5",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <button
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          onClick={() => setCollapsed((current) => !current)}
          type="button"
        >
          <ChevronDown
            className={cn(
              "mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-transform",
              collapsed && "-rotate-90"
            )}
          />
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-foreground/90">
              Get in touch
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/65">
              {headerSubtitle}
            </p>
          </div>
        </button>
        <button
          aria-label="Dismiss contact card"
          className="shrink-0 rounded-md p-0.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
          onClick={() => setDismissed(true)}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {!collapsed ? (
        <div className="mt-3 space-y-3 border-t border-border/30 pt-3">
          {notifyStep === "done" ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-green-500/20 bg-green-500/8 px-3 py-2.5">
              <CheckCircle2 className="size-4 shrink-0 text-green-600" />
              <div>
                <p className="text-[12px] font-medium text-green-700 dark:text-green-400">
                  Dhruvil notified!
                </p>
                <p className="text-[11px] text-green-600/70 dark:text-green-500/70">
                  He&apos;ll be in touch soon.
                </p>
              </div>
            </div>
          ) : notifyStep === "error" ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2.5">
              <XCircle className="size-4 shrink-0 text-red-500" />
              <div>
                <p className="text-[12px] font-medium text-red-600">
                  Couldn&apos;t send — email not configured.
                </p>
                <p className="text-[11px] text-red-500/70">
                  Try reaching out directly via the contact section.
                </p>
              </div>
            </div>
          ) : notifyStep === "note" ? (
            <div>
              <p className="mb-2 text-[12px] font-medium text-foreground/90">
                Add a note for Dhruvil{" "}
                <span className="font-normal text-muted-foreground/60">
                  (optional)
                </span>
              </p>
              <textarea
                autoFocus
                className={cn(
                  "w-full resize-none rounded-lg border border-border/40 bg-background px-3 py-2",
                  "text-[12px] text-foreground placeholder:text-muted-foreground/40",
                  "min-h-[64px] focus:border-border/70 focus:outline-none"
                )}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. We're hiring for a senior role starting Q3, fully remote…"
                value={note}
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-opacity hover:opacity-80"
                  onClick={() => void sendNotification()}
                  type="button"
                >
                  Send notification
                </button>
                <button
                  className="rounded-lg border border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/40"
                  onClick={() => setNotifyStep("prompt")}
                  type="button"
                >
                  Back
                </button>
              </div>
            </div>
          ) : notifyStep === "sending" ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
            </div>
          ) : (
            <>
              {showSchedule ? (
                <div className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/50 p-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07]">
                    <Calendar className="size-3.5 text-foreground/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-foreground/90">
                      Strong match — book a call
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/70">
                      {parsed.fitScoreLabel} fit for{" "}
                      <span className="font-medium text-foreground/80">
                        {parsed.roleTitle}
                      </span>
                      . Scores {JOB_FIT_SCHEDULE_CALL_MIN_SCORE}%+ usually mean
                      a conversation is worth having.
                    </p>
                    <div className="mt-2.5">
                      <ContactLink
                        channel="calendly"
                        className="inline-flex items-center rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-opacity hover:opacity-80"
                        href={calendly}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Schedule a call
                      </ContactLink>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/50 p-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07]">
                  <Bell className="size-3.5 text-foreground/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground/90">
                    Interested in Dhruvil for this role?
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/70">
                    Notify him about this opportunity — he&apos;ll receive the
                    JD, fit analysis, and the {parsed.fitScoreLabel} match
                    score.
                  </p>
                  <div className="mt-2.5">
                    <button
                      className="rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-opacity hover:opacity-80"
                      onClick={() => setNotifyStep("note")}
                      type="button"
                    >
                      Yes, notify Dhruvil
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

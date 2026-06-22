"use client"

import { Bell, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

type Props = {
  fitAnalysis: string
  jdText: string
}

type Step = "prompt" | "note" | "sending" | "done" | "dismissed" | "error"

export function JobFitNotifyCard({ fitAnalysis, jdText }: Props) {
  const [step, setStep] = useState<Step>("prompt")
  const [note, setNote] = useState("")

  // extract score from analysis text e.g. "**Overall Fit Score: 87%**"
  const scoreMatch = fitAnalysis.match(/fit score[:\s*]+(\d+%)/i)
  const fitScore = scoreMatch?.[1]

  // extract role name e.g. "## Fit Analysis: AI Engineer"
  const roleMatch = fitAnalysis.match(/fit analysis[:\s*]+([^\n*]+)/i)
  const jobTitle = roleMatch?.[1]?.trim()

  async function sendNotification() {
    setStep("sending")
    try {
      const res = await fetch("/api/notify-employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          jdText,
          fitAnalysis,
          fitScore,
          employerNote: note.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setStep("done")
    } catch {
      setStep("error")
    }
  }

  if (step === "dismissed") return null

  if (step === "done") {
    return (
      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/8 px-3.5 py-3">
        <CheckCircle2 className="size-4 shrink-0 text-green-600" />
        <div>
          <p className="text-[12px] font-medium text-green-700 dark:text-green-400">Dhruvil notified!</p>
          <p className="text-[11px] text-green-600/70 dark:text-green-500/70">He'll be in touch soon.</p>
        </div>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 px-3.5 py-3">
        <XCircle className="size-4 shrink-0 text-red-500" />
        <div>
          <p className="text-[12px] font-medium text-red-600">Couldn&apos;t send — email not configured.</p>
          <p className="text-[11px] text-red-500/70">Try reaching out directly via the contact section.</p>
        </div>
      </div>
    )
  }

  if (step === "prompt") {
    return (
      <div className="mt-3 rounded-xl border border-border/50 bg-muted/20 p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07]">
            <Bell className="size-3.5 text-foreground/60" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-medium text-foreground/90">
              Interested in Dhruvil for this role?
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/70">
              Notify him about this opportunity — he'll receive the JD, fit analysis
              {fitScore ? `, and the ${fitScore} match score` : ""}.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-opacity hover:opacity-80"
                onClick={() => setStep("note")}
                type="button"
              >
                Yes, notify Dhruvil
              </button>
              <button
                className="rounded-lg border border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/40"
                onClick={() => setStep("dismissed")}
                type="button"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === "note") {
    return (
      <div className="mt-3 rounded-xl border border-border/50 bg-muted/20 p-3.5">
        <p className="mb-2 text-[12px] font-medium text-foreground/90">
          Add a note for Dhruvil{" "}
          <span className="font-normal text-muted-foreground/60">(optional)</span>
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
            onClick={sendNotification}
            type="button"
          >
            Send notification
          </button>
          <button
            className="rounded-lg border border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/40"
            onClick={() => setStep("prompt")}
            type="button"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center justify-center py-3">
      <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
    </div>
  )
}

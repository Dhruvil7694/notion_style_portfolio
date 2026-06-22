"use client"

import { Check, ExternalLink, RefreshCw, Send, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

import { createAnalyticsEvent } from "@/lib/analytics/events"
import { cn } from "@/lib/utils"

type ClarificationOption = {
  label: string
  value: string
  description?: string
}

type DiffField = {
  name: string
  key?: string
  before: unknown
  after: unknown
}

type PendingAction = {
  id: string
  label: string
  description?: string
  entityLabel: string
  applyTool: string
  applyArgs: Record<string, unknown>
  fields: DiffField[]
  variants?: Array<{ label: string; value: string }>
  variantArgKey?: string
  redirectUrl?: string
  redirectLabel?: string
  /** Original propose tool + args, captured server-side for Regenerate. */
  proposeTool?: string
  proposeArgs?: Record<string, unknown>
  /** Clarification request fields — when set, renders a question card instead of a diff. */
  clarificationQuestion?: string
  clarificationOptions?: ClarificationOption[]
  allowCustom?: boolean
}

type CopilotMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  pendingActions?: PendingAction[]
  redirectUrl?: string
  redirectLabel?: string
  finalText?: string
}

type ChatSession = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

type StoredMessage = {
  id: string
  role: string
  content: string
  metadata?: Record<string, unknown> | null
}

export function CopilotClient() {
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async () => {
    const response = await fetch("/api/copilot/sessions")
    if (response.ok) {
      const data = (await response.json()) as { sessions: ChatSession[] }
      setSessions(data.sessions)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
    void createAnalyticsEvent("copilot_opened", {})
  }, [loadSessions])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  async function loadSession(id: string) {
    const response = await fetch(`/api/copilot/sessions?sessionId=${id}`)
    if (!response.ok) return
    const data = (await response.json()) as { messages: StoredMessage[] }
    setSessionId(id)
    setMessages(
      data.messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          pendingActions:
            (msg.metadata?.pendingActions as PendingAction[] | undefined) ??
            undefined,
          redirectUrl: msg.metadata?.redirectUrl as string | undefined,
          redirectLabel: msg.metadata?.redirectLabel as string | undefined,
          finalText: msg.metadata?.finalText as string | undefined,
        }))
    )
  }

  async function streamInto(response: Response, assistantId: string) {
    const newSessionId = response.headers.get("X-Copilot-Session-Id")
    if (newSessionId && !sessionId) {
      setSessionId(newSessionId)
      void loadSessions()
    }

    const reader = response.body?.getReader()
    if (!reader) return
    const decoder = new TextDecoder()
    let text = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6)) as {
            type: string
            text?: string
            pendingActions?: PendingAction[]
            redirectUrl?: string
            redirectLabel?: string
            finalText?: string
          }
          if (data.type === "text" && data.text) {
            text += data.text
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId ? { ...msg, content: text } : msg
              )
            )
          }
          if (data.type === "done") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      pendingActions: data.pendingActions,
                      redirectUrl: data.redirectUrl,
                      redirectLabel: data.redirectLabel,
                      finalText: data.finalText,
                    }
                  : msg
              )
            )
          }
        } catch {
          // skip malformed chunk
        }
      }
    }
  }

  async function handleSubmit(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading) return
    if (!overrideText) setInput("")
    setIsLoading(true)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: assistantId, role: "assistant", content: "" },
    ])

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      })
      if (!response.ok) throw new Error("Copilot request failed")
      await streamInto(response, assistantId)
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "Something went wrong. Check the AI provider settings." }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleClarificationAnswer(pending: PendingAction, answer: string) {
    // Remove the clarification card from the UI immediately.
    setMessages((prev) =>
      prev.map((msg) =>
        msg.pendingActions?.some((p) => p.id === pending.id)
          ? {
              ...msg,
              pendingActions: msg.pendingActions.filter((p) => p.id !== pending.id),
            }
          : msg
      )
    )
    // Submit the answer as a new user message so the LLM can continue.
    void handleSubmit(answer)
  }

  async function handleAction(
    action: "confirm" | "cancel" | "regenerate",
    pending: PendingAction,
    overrides?: { applyArgs?: Record<string, unknown> }
  ) {
    if (!sessionId || actionLoadingId) return
    setActionLoadingId(pending.id)
    setIsLoading(true)

    setMessages((prev) =>
      prev.map((msg) =>
        msg.pendingActions?.some((p) => p.id === pending.id)
          ? {
              ...msg,
              pendingActions: msg.pendingActions.filter((p) => p.id !== pending.id),
            }
          : msg
      )
    )

    const assistantId = crypto.randomUUID()
    const placeholder =
      action === "confirm"
        ? "Saving your edit…"
        : action === "regenerate"
          ? "Cooking up fresh takes…"
          : ""
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: placeholder },
    ])

    const body =
      action === "confirm"
        ? {
            action,
            sessionId,
            pendingActionId: pending.id,
            applyTool: pending.applyTool,
            applyArgs: overrides?.applyArgs ?? pending.applyArgs,
          }
        : action === "cancel"
          ? { action, sessionId, pendingActionId: pending.id }
          : {
              action,
              sessionId,
              pendingActionId: pending.id,
              proposeTool: pending.proposeTool,
              proposeArgs: pending.proposeArgs,
            }

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error("Action failed")
      await streamInto(response, assistantId)
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "Action failed. Try again." }
            : msg
        )
      )
    } finally {
      setActionLoadingId(null)
      setIsLoading(false)
    }
  }

  function handleNewSession() {
    setSessionId(null)
    setMessages([])
  }

  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return i
    }
    return -1
  })()

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="border-border hidden w-56 shrink-0 flex-col border-r pr-4 md:flex">
        <button
          className="border-border bg-muted/40 hover:bg-muted/60 mb-3 rounded-lg border px-3 py-2 text-sm transition-colors"
          onClick={handleNewSession}
          type="button"
        >
          New conversation
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={cn(
                "hover:bg-muted/60 w-full truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                sessionId === session.id && "bg-muted font-medium"
              )}
              onClick={() => loadSession(session.id)}
              type="button"
            >
              {session.title}
            </button>
          ))}
        </div>
      </aside>

      <div className="border-border flex min-w-0 flex-1 flex-col rounded-xl border">
        <header className="border-border flex items-center gap-2 border-b px-4 py-3">
          <Sparkles className="text-muted-foreground size-4" />
          <div>
            <p className="text-sm font-medium">CMS Copilot</p>
            <p className="text-muted-foreground text-xs">
              Portfolio architect — audit, generate, and improve
            </p>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>Try:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Audit my portfolio</li>
                <li>In the about page, make the intro warmer but keep the SEO keywords</li>
                <li>Add LangGraph as an ai_ml skill</li>
                <li>Rewrite the summary of the BohrAI project to be more concise</li>
                <li>List all my draft projects</li>
              </ul>
            </div>
          )}

          {messages.map((message, index) => {
            const showActions =
              message.role === "assistant" &&
              index === lastAssistantIndex &&
              (message.pendingActions?.length ?? 0) > 0

            return (
              <div key={message.id} className="space-y-2">
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-foreground text-background ml-auto"
                      : "border-border bg-muted/40 border"
                  )}
                >
                  {message.content ||
                    (message.role === "assistant" && isLoading ? "…" : "")}
                </div>

                {showActions &&
                  message.pendingActions!.map((pending) =>
                    pending.clarificationQuestion ? (
                      <ClarificationCard
                        key={pending.id}
                        pending={pending}
                        disabled={isLoading}
                        onAnswer={(answer) => handleClarificationAnswer(pending, answer)}
                      />
                    ) : (
                      <PendingActionCard
                        key={pending.id}
                        pending={pending}
                        busy={actionLoadingId === pending.id}
                        disabled={
                          actionLoadingId !== null && actionLoadingId !== pending.id
                        }
                        onConfirm={(applyArgs) =>
                          void handleAction("confirm", pending, { applyArgs })
                        }
                        onCancel={() => void handleAction("cancel", pending)}
                        onRegenerate={() => void handleAction("regenerate", pending)}
                      />
                    )
                  )}

                {message.role === "assistant" && message.finalText && (
                  <div className="border-border bg-background max-w-[85%] space-y-2 rounded-lg border p-3 shadow-sm">
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                      Now live
                    </p>
                    <p className="text-sm leading-relaxed">{message.finalText}</p>
                    {message.redirectUrl && (
                      <Link
                        className="border-border bg-background hover:bg-muted/60 mt-1 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                        href={message.redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3.5" />
                        {message.redirectLabel ?? "Open"}
                      </Link>
                    )}
                  </div>
                )}

                {message.role === "assistant" &&
                  message.redirectUrl &&
                  !message.finalText && (
                    <Link
                      className="border-border bg-background hover:bg-muted/60 inline-flex max-w-[85%] items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                      href={message.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-3.5" />
                      {message.redirectLabel ?? "Open"}
                    </Link>
                  )}
              </div>
            )
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <p className="text-muted-foreground text-xs">Thinking…</p>
          )}
        </div>

        <div className="border-border flex items-end gap-2 border-t p-3">
          <textarea
            className="border-border bg-background focus:ring-ring/30 focus:border-ring max-h-24 min-h-[40px] flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            disabled={isLoading}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void handleSubmit(undefined)
              }
            }}
            placeholder="Ask the portfolio architect…"
            rows={1}
            value={input}
          />
          <button
            aria-label="Send"
            className="border-border hover:bg-muted/60 flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-40"
            disabled={isLoading || !input.trim()}
            onClick={() => void handleSubmit(undefined)}
            type="button"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)"
  if (typeof value === "string") return value
  if (typeof value === "boolean") return value ? "yes" : "no"
  if (typeof value === "number") return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return "(empty list)"
    return value
      .map((item) =>
        typeof item === "string" ? item : JSON.stringify(item, null, 2)
      )
      .join("\n")
  }
  return JSON.stringify(value, null, 2)
}

function PendingActionCard({
  pending,
  busy,
  disabled,
  onConfirm,
  onCancel,
  onRegenerate,
}: {
  pending: PendingAction
  busy: boolean
  disabled: boolean
  onConfirm: (applyArgs: Record<string, unknown>) => void
  onCancel: () => void
  onRegenerate: () => void
}) {
  const hasVariants = (pending.variants?.length ?? 0) > 0
  const [variantIndex, setVariantIndex] = useState(0)
  // Editable copy of applyArgs — admin can tweak AFTER values before confirming.
  const [editedArgs, setEditedArgs] = useState<Record<string, unknown>>(
    () => ({ ...pending.applyArgs })
  )

  const selectedVariant = hasVariants ? pending.variants![variantIndex] : null

  function setField(key: string, value: unknown) {
    setEditedArgs((prev) => ({ ...prev, [key]: value }))
  }

  const buildConfirmArgs = (): Record<string, unknown> => {
    const base = { ...editedArgs }
    if (hasVariants && pending.variantArgKey && selectedVariant) {
      base[pending.variantArgKey] = selectedVariant.value
    }
    return base
  }

  // Build display fields, merging edited values into AFTER for preview.
  const displayFields: DiffField[] = pending.fields.map((field, idx) => {
    if (idx === 0 && hasVariants && pending.variantArgKey && selectedVariant) {
      return { ...field, after: selectedVariant.value }
    }
    if (field.key && field.key in editedArgs) {
      return { ...field, after: editedArgs[field.key] }
    }
    return field
  })

  return (
    <div className="border-border bg-background max-w-[85%] space-y-3 rounded-lg border p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {pending.entityLabel}
          </p>
          <p className="text-sm font-medium">{pending.label}</p>
          {pending.description && (
            <p className="text-muted-foreground text-xs">{pending.description}</p>
          )}
        </div>
        <span className="text-muted-foreground bg-muted shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]">
          {pending.applyTool}
        </span>
      </div>

      {hasVariants && pending.variants!.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Pick a tone
          </p>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {pending.variants!.map((variant, idx) => (
              <button
                key={variant.label}
                onClick={() => setVariantIndex(idx)}
                type="button"
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                  variantIndex === idx
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:bg-muted/60"
                )}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {displayFields.map((field) => {
          const isEditable =
            !!field.key &&
            !hasVariants &&
            (typeof field.after === "string" || Array.isArray(field.after))
          const currentVal = field.key ? (editedArgs[field.key] ?? field.after) : field.after
          return (
            <FieldDiff
              key={field.key ?? field.name}
              field={field}
              editableAfter={isEditable}
              editedValue={isEditable ? currentVal : undefined}
              onEdit={
                isEditable && field.key
                  ? (v) => setField(field.key!, v)
                  : undefined
              }
            />
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          disabled={busy || disabled}
          onClick={() => onConfirm(buildConfirmArgs())}
          type="button"
        >
          <Check className="size-3.5" />
          {busy ? "Applying…" : "Confirm"}
        </button>
        {pending.proposeTool && (
          <button
            className="border-border hover:bg-muted/60 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            disabled={busy || disabled}
            onClick={onRegenerate}
            type="button"
          >
            <RefreshCw className="size-3.5" />
            Regenerate
          </button>
        )}
        <button
          className="border-border hover:bg-muted/60 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          disabled={busy || disabled}
          onClick={onCancel}
          type="button"
        >
          <X className="size-3.5" />
          Cancel
        </button>
      </div>
    </div>
  )
}

function ClarificationCard({
  pending,
  disabled,
  onAnswer,
}: {
  pending: PendingAction
  disabled: boolean
  onAnswer: (answer: string) => void
}) {
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState("")

  return (
    <div className="border-border bg-background max-w-[85%] space-y-3 rounded-lg border p-3 shadow-sm">
      <div>
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {pending.entityLabel}
        </p>
        <p className="text-sm font-medium">{pending.clarificationQuestion}</p>
        {pending.description && (
          <p className="text-muted-foreground text-xs">{pending.description}</p>
        )}
      </div>

      {!customMode && (
        <div className="flex flex-wrap gap-2">
          {pending.clarificationOptions?.map((opt) => (
            <button
              key={opt.value}
              disabled={disabled}
              onClick={() => onAnswer(opt.value)}
              type="button"
              className={cn(
                "rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
                "border-border hover:bg-muted/60 disabled:opacity-40"
              )}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
          {pending.allowCustom !== false && (
            <button
              disabled={disabled}
              onClick={() => setCustomMode(true)}
              type="button"
              className="border-border hover:bg-muted/60 rounded-md border px-3 py-1.5 text-xs text-muted-foreground transition-colors disabled:opacity-40"
            >
              Other…
            </button>
          )}
        </div>
      )}

      {customMode && (
        <div className="flex gap-2">
          <input
            autoFocus
            className="border-border bg-background focus:border-ring flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none"
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customValue.trim()) {
                onAnswer(customValue.trim())
              }
            }}
            placeholder="Type your answer…"
            value={customValue}
          />
          <button
            disabled={!customValue.trim() || disabled}
            onClick={() => onAnswer(customValue.trim())}
            type="button"
            className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Check className="size-3.5" />
            Send
          </button>
          <button
            onClick={() => {
              setCustomMode(false)
              setCustomValue("")
            }}
            type="button"
            className="border-border hover:bg-muted/60 rounded-md border px-3 py-1.5 text-xs transition-colors"
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}

function FieldDiff({
  field,
  editableAfter,
  editedValue,
  onEdit,
}: {
  field: DiffField
  editableAfter?: boolean
  editedValue?: unknown
  onEdit?: (value: unknown) => void
}) {
  const before = renderValue(field.before)
  const displayAfter = editedValue !== undefined ? editedValue : field.after
  const afterStr = renderValue(displayAfter)
  const unchanged = before === afterStr
  const isArray = Array.isArray(displayAfter)

  return (
    <div className="border-border rounded-md border">
      <div className="border-border flex items-center justify-between border-b px-2 py-1">
        <span className="text-muted-foreground font-mono text-[10px] uppercase">
          {field.name}
        </span>
        {unchanged && !editableAfter && (
          <span className="text-muted-foreground text-[10px]">no change</span>
        )}
        {editableAfter && (
          <span className="text-muted-foreground text-[10px]">editable</span>
        )}
      </div>
      <div className="grid divide-y sm:divide-x sm:divide-y-0 sm:grid-cols-2 divide-border">
        <div className="px-2 py-1.5">
          <p className="text-muted-foreground text-[10px] uppercase mb-0.5">Before</p>
          <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
            {before}
          </p>
        </div>
        <div className="bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground text-[10px] uppercase mb-0.5">After</p>
          {editableAfter && onEdit ? (
            isArray ? (
              <textarea
                className="border-border bg-background focus:border-ring w-full rounded border px-2 py-1 text-xs focus:outline-none"
                defaultValue={(displayAfter as string[]).join(", ")}
                onChange={(e) =>
                  onEdit(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="comma-separated values"
                rows={2}
              />
            ) : (
              <textarea
                className="border-border bg-background focus:border-ring w-full rounded border px-2 py-1 text-xs focus:outline-none"
                defaultValue={String(displayAfter ?? "")}
                onChange={(e) => onEdit(e.target.value)}
                rows={typeof displayAfter === "string" && displayAfter.length > 80 ? 3 : 1}
              />
            )
          ) : (
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{afterStr}</p>
          )}
        </div>
      </div>
    </div>
  )
}

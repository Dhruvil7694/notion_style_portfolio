"use client"

import {
  ArrowUp,
  Check,
  ExternalLink,
  History,
  Plus,
  RefreshCw,
  Send,
  Square,
  X,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

import { CopilotHistorySidebar } from "@/features/copilot/components/copilot-history-sidebar"
import {
  CopilotAssistantMessage,
  CopilotUserMessage,
} from "@/features/copilot/components/copilot-message"
import {
  type GroupByOption,
  removeSessionPreferences,
  sortSessionsByUpdated,
  updateSessionPreferences,
} from "@/features/copilot/lib/session-preferences"
import {
  formatUserFacingError,
  readResponseErrorMessage,
  type UserFacingErrorDisplay,
} from "@/features/portfolio/lib/user-facing-error"
import { ErrorAlert } from "@/shared/components/error-alert"
import { captureEvent } from "@/shared/lib/analytics/posthog-client"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/shared/ui/chat-container"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/shared/ui/prompt-input"
import { PromptSuggestion } from "@/shared/ui/prompt-suggestion"
import { TextShimmer } from "@/shared/ui/text-shimmer"

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
  createdAt?: string
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
  created_at?: string
  metadata?: Record<string, unknown> | null
}

type CopilotRetryRequest =
  | { kind: "message"; text: string }
  | {
      kind: "action"
      action: "confirm" | "cancel" | "regenerate"
      pending: PendingAction
      applyArgs?: Record<string, unknown>
    }

function removeAssistantMessage(
  messages: CopilotMessage[],
  assistantId: string
): CopilotMessage[] {
  return messages.filter((message) => message.id !== assistantId)
}

const COPILOT_PROMPT_SUGGESTIONS = [
  "Audit my portfolio",
  "In the about page, make the intro warmer but keep the SEO keywords",
  "Add LangGraph as an ai_ml skill",
  "Rewrite the summary of the BohrAI project to be more concise",
  "List all my draft projects",
] as const

export function CopilotClient() {
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<UserFacingErrorDisplay | null>(
    null
  )
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] =
    useState<UserFacingErrorDisplay | null>(null)
  const [sessionLoadError, setSessionLoadError] =
    useState<UserFacingErrorDisplay | null>(null)
  const [failedSessionId, setFailedSessionId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupByOption>("none")
  const [preferencesVersion, setPreferencesVersion] = useState(0)
  const retryRef = useRef<CopilotRetryRequest | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setHistoryOpen(true)
    }
  }, [])

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const response = await fetch("/api/copilot/sessions")
      if (!response.ok) {
        setSessionsError(
          formatUserFacingError(
            await readResponseErrorMessage(
              response,
              "Couldn't load conversations."
            )
          )
        )
        return
      }
      const data = (await response.json()) as { sessions: ChatSession[] }
      setSessions(sortSessionsByUpdated(data.sessions))
    } catch (error) {
      setSessionsError(formatUserFacingError(error))
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
    captureEvent("copilot_opened", {})
  }, [loadSessions])

  const loadSession = useCallback(async (id: string) => {
    setSessionLoadError(null)
    setFailedSessionId(null)
    try {
      const response = await fetch(`/api/copilot/sessions?sessionId=${id}`)
      if (!response.ok) {
        setFailedSessionId(id)
        setSessionLoadError(
          formatUserFacingError(
            await readResponseErrorMessage(
              response,
              "Couldn't load this conversation."
            )
          )
        )
        return
      }
      const data = (await response.json()) as { messages: StoredMessage[] }
      setSessionId(id)
      updateSessionPreferences(id, { unread: false })
      setPreferencesVersion((value) => value + 1)
      setMessages(
        data.messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: msg.created_at,
            pendingActions:
              (msg.metadata?.pendingActions as PendingAction[] | undefined) ??
              undefined,
            redirectUrl: msg.metadata?.redirectUrl as string | undefined,
            redirectLabel: msg.metadata?.redirectLabel as string | undefined,
            finalText: msg.metadata?.finalText as string | undefined,
          }))
      )
    } catch (error) {
      setFailedSessionId(id)
      setSessionLoadError(formatUserFacingError(error))
    }
  }, [])

  async function streamInto(response: Response, assistantId: string) {
    const newSessionId = response.headers.get("X-Copilot-Session-Id")
    if (newSessionId && !sessionId) {
      setSessionId(newSessionId)
      updateSessionPreferences(newSessionId, { unread: false })
      setPreferencesVersion((value) => value + 1)
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
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "))
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

  async function sendCopilotMessage(
    text: string,
    mode: "new" | "retry" = "new"
  ) {
    if (!text || isLoading) return
    setIsLoading(true)
    setStreamError(null)
    retryRef.current = { kind: "message", text }
    abortRef.current = new AbortController()

    const now = new Date().toISOString()
    const assistantId = crypto.randomUUID()
    if (mode === "new") {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          createdAt: now,
        },
        { id: assistantId, role: "assistant", content: "", createdAt: now },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", createdAt: now },
      ])
    }

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
        signal: abortRef.current?.signal,
      })
      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(response, "Copilot request failed")
        )
      }
      await streamInto(response, assistantId)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      setStreamError(formatUserFacingError(error))
      setMessages((prev) => removeAssistantMessage(prev, assistantId))
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  async function handleSubmit(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text) return
    if (!overrideText) setInput("")
    await sendCopilotMessage(text, "new")
  }

  function retryCopilot() {
    const retry = retryRef.current
    setStreamError(null)
    if (!retry) return

    if (retry.kind === "message") {
      void sendCopilotMessage(retry.text, "retry")
      return
    }

    void handleAction(retry.action, retry.pending, {
      applyArgs: retry.applyArgs,
    })
  }

  function handleClarificationAnswer(pending: PendingAction, answer: string) {
    // Remove the clarification card from the UI immediately.
    setMessages((prev) =>
      prev.map((msg) =>
        msg.pendingActions?.some((p) => p.id === pending.id)
          ? {
              ...msg,
              pendingActions: msg.pendingActions.filter(
                (p) => p.id !== pending.id
              ),
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
    if (action === "confirm") {
      captureEvent("copilot_tool_invoked", { tool: pending.applyTool })
    }
    setActionLoadingId(pending.id)
    setIsLoading(true)
    setStreamError(null)
    abortRef.current = new AbortController()
    retryRef.current = {
      kind: "action",
      action,
      pending,
      applyArgs: overrides?.applyArgs,
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.pendingActions?.some((p) => p.id === pending.id)
          ? {
              ...msg,
              pendingActions: msg.pendingActions.filter(
                (p) => p.id !== pending.id
              ),
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
      {
        id: assistantId,
        role: "assistant",
        content: placeholder,
        createdAt: new Date().toISOString(),
      },
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
        signal: abortRef.current?.signal,
      })
      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(response, "Action failed")
        )
      }
      await streamInto(response, assistantId)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      setStreamError(formatUserFacingError(error))
      setMessages((prev) => removeAssistantMessage(prev, assistantId))
    } finally {
      setActionLoadingId(null)
      setIsLoading(false)
      abortRef.current = null
    }
  }

  function handleNewSession() {
    if (sessionId) {
      updateSessionPreferences(sessionId, { unread: true })
      bumpPreferences()
    }
    setSessionId(null)
    setMessages([])
    setStreamError(null)
    setSessionLoadError(null)
    setFailedSessionId(null)
    retryRef.current = null
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }

  function handleStop() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
    setActionLoadingId(null)
  }

  function bumpPreferences() {
    setPreferencesVersion((value) => value + 1)
  }

  async function handleRenameSession(sessionIdToRename: string, title: string) {
    try {
      const response = await fetch("/api/copilot/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdToRename, title }),
      })
      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Couldn't rename conversation."
          )
        )
      }
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionIdToRename ? { ...session, title } : session
        )
      )
    } catch (error) {
      setStreamError(formatUserFacingError(error))
    }
  }

  async function handleDeleteSession(sessionIdToDelete: string) {
    try {
      const response = await fetch(
        `/api/copilot/sessions?sessionId=${sessionIdToDelete}`,
        { method: "DELETE" }
      )
      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Couldn't delete conversation."
          )
        )
      }
      removeSessionPreferences(sessionIdToDelete)
      bumpPreferences()
      setSessions((prev) =>
        prev.filter((session) => session.id !== sessionIdToDelete)
      )
      if (sessionId === sessionIdToDelete) {
        setSessionId(null)
        setMessages([])
        setStreamError(null)
        setSessionLoadError(null)
        setFailedSessionId(null)
        retryRef.current = null
      }
    } catch (error) {
      setStreamError(formatUserFacingError(error))
    }
  }

  function handleSelectSession(id: string) {
    void loadSession(id)
    setHistoryOpen(false)
  }

  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return i
    }
    return -1
  })()

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-background">
      {historyOpen ? (
        <button
          aria-label="Close history"
          className="absolute inset-0 z-10 bg-black/20 md:hidden"
          onClick={() => setHistoryOpen(false)}
          type="button"
        />
      ) : null}

      <CopilotHistorySidebar
        activeSessionId={sessionId}
        groupBy={groupBy}
        onDeleteSession={handleDeleteSession}
        onGroupByChange={setGroupBy}
        onPreferencesChange={bumpPreferences}
        onRenameSession={handleRenameSession}
        onSelectSession={handleSelectSession}
        open={historyOpen}
        preferencesVersion={preferencesVersion}
        sessions={sessions}
      />

      <div className="relative flex min-w-0 flex-1 flex-col bg-background">
        <header className="border-border flex items-center gap-2 border-b px-3 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              aria-hidden
              className="admin-brand-mark-icon size-5 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Hello, I am Ojas!</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              aria-label={
                historyOpen ? "Hide chat history" : "Show chat history"
              }
              className="size-8 shrink-0"
              onClick={() => setHistoryOpen((value) => !value)}
              size="icon"
              type="button"
              variant={historyOpen ? "secondary" : "ghost"}
            >
              <History className="size-4" />
            </Button>
            <Button
              aria-label="New conversation"
              className="size-8 shrink-0"
              onClick={handleNewSession}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </header>

        <ChatContainerRoot className="min-h-0 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <ChatContainerContent className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-4 pb-28 sm:gap-8 sm:px-4">
            {sessionLoadError ? (
              <ErrorAlert
                error={sessionLoadError}
                onDismiss={() => setSessionLoadError(null)}
                onRetry={
                  sessionLoadError.canRetry && failedSessionId
                    ? () => void loadSession(failedSessionId)
                    : undefined
                }
                size="md"
              />
            ) : null}

            {sessionsLoading ? (
              <TextShimmer className="text-xs" duration={2}>
                Loading conversations…
              </TextShimmer>
            ) : null}
            {sessionsError ? (
              <ErrorAlert
                error={sessionsError}
                onRetry={() => void loadSessions()}
                size="sm"
              />
            ) : null}

            {messages.length === 0 && !sessionLoadError && (
              <div className="mx-auto w-full max-w-2xl space-y-3">
                <p className="text-muted-foreground text-sm">Try:</p>
                <div className="flex flex-col gap-1">
                  {COPILOT_PROMPT_SUGGESTIONS.map((suggestion) => (
                    <PromptSuggestion
                      key={suggestion}
                      disabled={isLoading}
                      highlight="___"
                      onClick={() => void handleSubmit(suggestion)}
                    >
                      {suggestion}
                    </PromptSuggestion>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const showActions =
                message.role === "assistant" &&
                index === lastAssistantIndex &&
                (message.pendingActions?.length ?? 0) > 0
              const isStreamingAssistant =
                isLoading &&
                message.role === "assistant" &&
                index === lastAssistantIndex

              return (
                <div key={message.id} className="space-y-2">
                  {message.role === "user" ? (
                    <CopilotUserMessage
                      content={message.content}
                      createdAt={message.createdAt}
                    />
                  ) : (
                    <CopilotAssistantMessage
                      content={message.content}
                      createdAt={message.createdAt}
                      isStreaming={isStreamingAssistant}
                    />
                  )}

                  {showActions &&
                    message.pendingActions!.map((pending) =>
                      pending.clarificationQuestion ? (
                        <ClarificationCard
                          key={pending.id}
                          pending={pending}
                          disabled={isLoading}
                          onAnswer={(answer) =>
                            handleClarificationAnswer(pending, answer)
                          }
                        />
                      ) : (
                        <PendingActionCard
                          key={pending.id}
                          pending={pending}
                          busy={actionLoadingId === pending.id}
                          disabled={
                            actionLoadingId !== null &&
                            actionLoadingId !== pending.id
                          }
                          onConfirm={(applyArgs) =>
                            void handleAction("confirm", pending, { applyArgs })
                          }
                          onCancel={() => void handleAction("cancel", pending)}
                          onRegenerate={() =>
                            void handleAction("regenerate", pending)
                          }
                        />
                      )
                    )}

                  {message.role === "assistant" && message.finalText && (
                    <div className="border-border bg-background max-w-[85%] space-y-2 rounded-lg border p-3 shadow-sm">
                      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                        Now live
                      </p>
                      <p className="text-sm leading-relaxed">
                        {message.finalText}
                      </p>
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

            {streamError && !isLoading ? (
              <ErrorAlert
                error={streamError}
                onDismiss={() => setStreamError(null)}
                onRetry={streamError.canRetry ? retryCopilot : undefined}
                size="md"
              />
            ) : null}
            <ChatContainerScrollAnchor />
          </ChatContainerContent>
        </ChatContainerRoot>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3 sm:px-4 sm:pb-4">
          <PromptInput
            className="pointer-events-auto mx-auto w-full max-w-3xl border border-border/50 bg-background/70 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/55"
            disabled={isLoading}
            isLoading={isLoading}
            onSubmit={() => void handleSubmit(undefined)}
            onValueChange={setInput}
            value={input}
          >
            <PromptInputTextarea placeholder="Ask the portfolio architect…" />
            <PromptInputActions className="justify-end pt-2">
              <PromptInputAction
                tooltip={isLoading ? "Stop generation" : "Send message"}
              >
                <Button
                  className="size-8 rounded-full"
                  disabled={!isLoading && !input.trim()}
                  onClick={() => {
                    if (isLoading) {
                      handleStop()
                      return
                    }
                    void handleSubmit(undefined)
                  }}
                  size="icon"
                  type="button"
                >
                  {isLoading ? (
                    <Square className="size-5 fill-current" />
                  ) : (
                    <ArrowUp className="size-5" />
                  )}
                </Button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
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
  const [editedArgs, setEditedArgs] = useState<Record<string, unknown>>(() => ({
    ...pending.applyArgs,
  }))

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
            <p className="text-muted-foreground text-xs">
              {pending.description}
            </p>
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
          const currentVal = field.key
            ? (editedArgs[field.key] ?? field.after)
            : field.after
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
        <Button
          disabled={busy || disabled}
          onClick={() => onConfirm(buildConfirmArgs())}
          size="sm"
          type="button"
        >
          <Check aria-hidden className="size-3.5" />
          {busy ? "Applying…" : "Confirm"}
        </Button>
        {pending.proposeTool ? (
          <Button
            disabled={busy || disabled}
            onClick={onRegenerate}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw aria-hidden className="size-3.5" />
            Regenerate
          </Button>
        ) : null}
        <Button
          disabled={busy || disabled}
          onClick={onCancel}
          size="sm"
          type="button"
          variant="outline"
        >
          <X aria-hidden className="size-3.5" />
          Cancel
        </Button>
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
            <Send aria-hidden className="size-3.5" />
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
          <p className="text-muted-foreground text-[10px] uppercase mb-0.5">
            Before
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
            {before}
          </p>
        </div>
        <div className="bg-muted/30 px-2 py-1.5">
          <p className="text-muted-foreground text-[10px] uppercase mb-0.5">
            After
          </p>
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
                rows={
                  typeof displayAfter === "string" && displayAfter.length > 80
                    ? 3
                    : 1
                }
              />
            )
          ) : (
            <p className="text-xs leading-relaxed whitespace-pre-wrap">
              {afterStr}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

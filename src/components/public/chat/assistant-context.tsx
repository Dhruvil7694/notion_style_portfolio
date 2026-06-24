"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import type {
  AssistantCitationPayload,
  CitationBundle,
} from "@/lib/ai/citations/citation-types"
import { captureEvent } from "@/lib/analytics/posthog-client"
import {
  type AssistantChatErrorDisplay,
  formatAssistantChatError,
} from "@/lib/public/assistant-chat-error"
import { hashJobDescriptionContent } from "@/lib/public/job-description-validation"
import {
  appendJobFitHistoryEntry,
  buildJobFitHistoryEntry,
  clearJobFitHistoryStorage,
  type JobFitHistoryEntry,
  readJobFitHistory,
  removeJobFitHistoryEntry as dropJobFitHistoryEntry,
  writeJobFitHistory,
} from "@/lib/public/job-fit-history"
import {
  formatJdClassifierContext,
  type JobFitSubmissionMeta,
} from "@/lib/public/job-seniority"
import { isJobFitAnalysisMessage } from "@/lib/public/parse-job-fit-result"
import { recordAssistantQuestion } from "@/lib/public/visitor-interest"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: CitationBundle
  followups?: string[]
  timestamp: number
}

export type EntityLink = { title: string; path: string }

export type AssistantChatMode = "general" | "job-fit"

type AssistantContextValue = {
  open: boolean
  chatMode: AssistantChatMode
  toggle: () => void
  close: () => void
  newChat: () => void
  startJobFitMode: () => void
  startGeneralChat: () => void
  input: string
  setInput: (value: string) => void
  suggestions: string[]
  entityLinks: EntityLink[]
  welcomeText: string
  placeholderText: string
  calendlyUrl: string | null
  lastJdText: string | null
  jobFitHistory: JobFitHistoryEntry[]
  messages: ChatMessage[]
  isLoading: boolean
  chatError: AssistantChatErrorDisplay | null
  stop: () => void
  clearChatError: () => void
  retryChat: () => void
  submit: () => void
  submitQuestion: (question: string) => void
  submitJobFit: (jd: string, meta?: JobFitSubmissionMeta) => void
  prepareAnotherJobFit: () => void
  removeJobFitHistoryEntry: (entryId: string) => void
  clearJobFitHistory: () => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

function shouldRecordAssistantQuestion(query: string): boolean {
  if (query.length > 280) return false
  return !/Analyse my job fit for this role:/i.test(query)
}

function getMessageText(message: {
  parts: { type: string; text?: string }[]
}): string {
  return message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text"
    )
    .map((part) => part.text)
    .join("\n")
}

function formatChatMessageContent(
  role: "user" | "assistant",
  content: string
): string {
  if (role === "user" && /Analyse my job fit for this role:/i.test(content)) {
    return "Job description submitted for fit analysis"
  }
  return content
}

const STORAGE_KEY = "portfolio_chat_v1"

type StoredChat = {
  open: boolean
  messages: unknown[]
  chatMode?: AssistantChatMode
}

function readStorage(): StoredChat | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredChat) : null
  } catch {
    return null
  }
}

function stripTrailingEmptyAssistant<
  T extends { role: string; parts: { type: string; text?: string }[] },
>(current: T[]): T[] {
  const last = current[current.length - 1]
  if (!last || last.role !== "assistant") return current
  if (getMessageText(last).trim()) return current
  return current.slice(0, -1)
}
function resetChatState(
  setMessages: ReturnType<typeof useChat>["setMessages"],
  setters: {
    setLastCitations: (v: CitationBundle | null) => void
    setLastFollowups: (v: string[]) => void
    setLastJdText: (v: string | null) => void
    setInput: (v: string) => void
  }
) {
  setMessages([])
  setters.setLastCitations(null)
  setters.setLastFollowups([])
  setters.setLastJdText(null)
  setters.setInput("")
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [chatMode, setChatMode] = useState<AssistantChatMode>("general")
  const storageRestoredRef = useRef(false)
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [entityLinks, setEntityLinks] = useState<EntityLink[]>([])
  const [welcomeText, setWelcomeText] = useState(
    "Ask about projects, expertise, technologies, or experience."
  )
  const [placeholderText, setPlaceholderText] = useState("Ask")
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null)
  const [lastCitations, setLastCitations] = useState<CitationBundle | null>(
    null
  )
  const [lastFollowups, setLastFollowups] = useState<string[]>([])
  const [lastJdText, setLastJdText] = useState<string | null>(null)
  const [jobFitHistory, setJobFitHistory] = useState<JobFitHistoryEntry[]>([])
  const excludedJobFitMessageIdsRef = useRef(new Set<string>())
  // track when each message was sent (by SDK message id)
  const [messageTimestamps] = useState(() => new Map<string, number>())

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  )

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    clearError,
    regenerate,
  } = useChat({
    transport,
    onData: (part) => {
      if (part.type === "data-citations") {
        const data = part.data as AssistantCitationPayload
        setLastCitations(data.citations)
        if (data.suggestions?.length) {
          setSuggestions(data.suggestions)
          setLastFollowups(data.suggestions.slice(0, 3))
        }
      }
    },
    onError: () => {
      setMessages((current) => stripTrailingEmptyAssistant(current))
    },
  })

  // restore open state + messages after mount — avoids SSR/client hydration mismatch
  useEffect(() => {
    const stored = readStorage()
    if (stored?.open) setOpen(stored.open)
    if (stored?.chatMode) setChatMode(stored.chatMode)
    if (stored?.messages?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessages(stored.messages as any)
    }
    if (stored?.chatMode === "job-fit") {
      setJobFitHistory(readJobFitHistory())
    }
    storageRestoredRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // persist open state + messages whenever they change
  useEffect(() => {
    if (!storageRestoredRef.current) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ open, messages, chatMode })
      )
    } catch {
      // storage full or disabled — ignore
    }
  }, [open, messages, chatMode])

  useEffect(() => {
    if (chatMode !== "job-fit") return
    writeJobFitHistory(jobFitHistory ?? [])
  }, [chatMode, jobFitHistory])

  // stamp timestamp when message first appears
  useEffect(() => {
    for (const m of messages) {
      if (!messageTimestamps.has(m.id)) {
        messageTimestamps.set(m.id, Date.now())
      }
    }
  }, [messages, messageTimestamps])

  const isLoading = status === "streaming" || status === "submitted"

  const chatError = useMemo(
    () => (error ? formatAssistantChatError(error) : null),
    [error]
  )

  const clearChatError = useCallback(() => {
    clearError()
  }, [clearError])

  const retryChat = useCallback(() => {
    clearError()
    void regenerate()
  }, [clearError, regenerate])

  useEffect(() => {
    if (chatMode !== "job-fit" || isLoading) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role !== "assistant") return
    if (excludedJobFitMessageIdsRef.current.has(lastMessage.id)) return

    const content = getMessageText(lastMessage)
    if (!isJobFitAnalysisMessage(content)) return

    const entry = buildJobFitHistoryEntry({
      messageId: lastMessage.id,
      analysisMarkdown: content,
      contentHash: lastJdText
        ? hashJobDescriptionContent(lastJdText)
        : undefined,
    })
    if (!entry) return

    setJobFitHistory((current) => appendJobFitHistoryEntry(current, entry))

    void fetch("/api/job-fit/analytics/fit-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisMarkdown: content,
        contentHash: lastJdText
          ? hashJobDescriptionContent(lastJdText)
          : undefined,
      }),
    }).catch(() => {})
  }, [chatMode, isLoading, messages, lastJdText])

  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then(
        (data: {
          suggestions?: string[]
          entities?: EntityLink[]
          welcomeText?: string
          placeholderText?: string
          calendlyUrl?: string | null
        }) => {
          setSuggestions(data.suggestions ?? [])
          if (data.entities?.length) setEntityLinks(data.entities)
          if (data.welcomeText) setWelcomeText(data.welcomeText)
          if (data.placeholderText) setPlaceholderText(data.placeholderText)
          setCalendlyUrl(data.calendlyUrl ?? null)
        }
      )
      .catch(() => {})
  }, [])

  const toggle = useCallback(() => {
    setOpen((current) => {
      if (!current) captureEvent("assistant_opened", { source: "dock" })
      return !current
    })
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const newChat = useCallback(() => {
    clearError()
    resetChatState(setMessages, {
      setLastCitations,
      setLastFollowups,
      setLastJdText,
      setInput,
    })
    setJobFitHistory([])
    clearJobFitHistoryStorage()
    excludedJobFitMessageIdsRef.current.clear()
    setChatMode("general")
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [clearError, setMessages])

  const startGeneralChat = useCallback(() => {
    clearError()
    resetChatState(setMessages, {
      setLastCitations,
      setLastFollowups,
      setLastJdText,
      setInput,
    })
    setJobFitHistory([])
    clearJobFitHistoryStorage()
    excludedJobFitMessageIdsRef.current.clear()
    setChatMode("general")
  }, [clearError, setMessages])

  const startJobFitMode = useCallback(() => {
    clearError()
    resetChatState(setMessages, {
      setLastCitations,
      setLastFollowups,
      setLastJdText,
      setInput,
    })
    setJobFitHistory([])
    clearJobFitHistoryStorage()
    excludedJobFitMessageIdsRef.current.clear()
    setChatMode("job-fit")
    captureEvent("assistant_job_fit_mode", { source: "header" })
  }, [clearError, setMessages])

  const prepareAnotherJobFit = useCallback(() => {
    clearError()
    setMessages([])
    setLastCitations(null)
    setLastFollowups([])
    setLastJdText(null)
    setInput("")
  }, [clearError, setMessages])

  const removeJobFitHistoryEntry = useCallback((entryId: string) => {
    setJobFitHistory((current) => {
      const target = current.find((entry) => entry.id === entryId)
      if (target) {
        excludedJobFitMessageIdsRef.current.add(target.messageId)
      }
      return dropJobFitHistoryEntry(current, entryId)
    })
  }, [])

  const clearJobFitHistory = useCallback(() => {
    setJobFitHistory((current) => {
      for (const entry of current) {
        excludedJobFitMessageIdsRef.current.add(entry.messageId)
      }
      return []
    })
    for (const message of messages) {
      if (message.role !== "assistant") continue
      const content = getMessageText(message)
      if (isJobFitAnalysisMessage(content)) {
        excludedJobFitMessageIdsRef.current.add(message.id)
      }
    }
    clearJobFitHistoryStorage()
  }, [messages])

  const stopGeneration = useCallback(() => {
    stop()
  }, [stop])

  const submitJobFit = useCallback(
    (jd: string, meta?: JobFitSubmissionMeta) => {
      const trimmed = jd.trim()
      if (!trimmed || isLoading) return
      const classifierContext = meta ? formatJdClassifierContext(meta) : ""
      const question = `Analyse my job fit for this role:${classifierContext}\n\n${trimmed}`
      setLastJdText(trimmed)
      setLastFollowups([])
      captureEvent("assistant_job_fit", {
        jd_length: trimmed.length,
      })
      void sendMessage({ text: question })
    },
    [isLoading, sendMessage]
  )

  const submitQuestion = useCallback(
    (question: string) => {
      if (chatMode === "job-fit") return
      if (shouldRecordAssistantQuestion(question))
        recordAssistantQuestion(question)
      captureEvent("assistant_question", {
        query: question,
        source: "suggestion",
      })
      const jdMatch = question.match(
        /Analyse my job fit for this role:\n\n([\s\S]+)/
      )
      if (jdMatch?.[1]) setLastJdText(jdMatch[1])
      setLastFollowups([])
      void sendMessage({ text: question })
    },
    [chatMode, sendMessage]
  )

  const submit = useCallback(() => {
    if (chatMode === "job-fit") return
    const text = input.trim()
    if (!text || isLoading) return
    if (shouldRecordAssistantQuestion(text)) recordAssistantQuestion(text)
    captureEvent("assistant_question", { query: text, source: "input" })
    setInput("")
    setLastFollowups([])
    void sendMessage({ text })
  }, [chatMode, input, isLoading, sendMessage])

  const chatMessages = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m, index, list) => {
          const isLast = index === list.length - 1
          return {
            id: m.id,
            role: m.role as "user" | "assistant",
            content: formatChatMessageContent(
              m.role as "user" | "assistant",
              getMessageText(m)
            ),
            timestamp: messageTimestamps.get(m.id) ?? Date.now(),
            citations:
              m.role === "assistant" && isLast
                ? (lastCitations ?? undefined)
                : undefined,
            followups:
              m.role === "assistant" &&
              isLast &&
              !isLoading &&
              chatMode === "general"
                ? lastFollowups
                : undefined,
          }
        }),
    [
      messages,
      lastCitations,
      lastFollowups,
      isLoading,
      messageTimestamps,
      chatMode,
    ]
  )

  const value = useMemo<AssistantContextValue>(
    () => ({
      open,
      chatMode,
      toggle,
      close,
      newChat,
      startJobFitMode,
      startGeneralChat,
      lastJdText,
      jobFitHistory: jobFitHistory ?? [],
      input,
      setInput,
      suggestions,
      entityLinks,
      welcomeText,
      placeholderText,
      calendlyUrl,
      messages: chatMessages,
      isLoading,
      chatError,
      stop: stopGeneration,
      clearChatError,
      retryChat,
      submit,
      submitQuestion,
      submitJobFit,
      prepareAnotherJobFit,
      removeJobFitHistoryEntry,
      clearJobFitHistory,
    }),
    [
      open,
      chatMode,
      toggle,
      close,
      newChat,
      startJobFitMode,
      startGeneralChat,
      lastJdText,
      jobFitHistory,
      input,
      suggestions,
      entityLinks,
      welcomeText,
      placeholderText,
      calendlyUrl,
      chatMessages,
      isLoading,
      chatError,
      stopGeneration,
      clearChatError,
      retryChat,
      submit,
      submitQuestion,
      submitJobFit,
      prepareAnotherJobFit,
      removeJobFitHistoryEntry,
      clearJobFitHistory,
    ]
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider")
  }

  return {
    ...context,
    jobFitHistory: context.jobFitHistory ?? [],
  }
}

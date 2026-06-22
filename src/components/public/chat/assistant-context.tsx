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

import type { AssistantCitationPayload, CitationBundle } from "@/lib/ai/citations/citation-types"
import { createAnalyticsEvent } from "@/lib/analytics/events"
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

type AssistantContextValue = {
  open: boolean
  toggle: () => void
  close: () => void
  newChat: () => void
  input: string
  setInput: (value: string) => void
  suggestions: string[]
  entityLinks: EntityLink[]
  welcomeText: string
  placeholderText: string
  lastJdText: string | null
  messages: ChatMessage[]
  isLoading: boolean
  submit: () => void
  submitQuestion: (question: string) => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

function shouldRecordAssistantQuestion(query: string): boolean {
  if (query.length > 280) return false
  return !/Analyse my job fit for this role:/i.test(query)
}

function getMessageText(message: { parts: { type: string; text?: string }[] }): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
}

const STORAGE_KEY = "portfolio_chat_v1"

function readStorage() {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { open: boolean; messages: unknown[] }) : null
  } catch {
    return null
  }
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const storageRestoredRef = useRef(false)
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [entityLinks, setEntityLinks] = useState<EntityLink[]>([])
  const [welcomeText, setWelcomeText] = useState(
    "Ask about projects, expertise, technologies, or experience."
  )
  const [placeholderText, setPlaceholderText] = useState("Ask")
  const [lastCitations, setLastCitations] = useState<CitationBundle | null>(null)
  const [lastFollowups, setLastFollowups] = useState<string[]>([])
  const [lastJdText, setLastJdText] = useState<string | null>(null)
  // track when each message was sent (by SDK message id)
  const [messageTimestamps] = useState(() => new Map<string, number>())

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  )

  const { messages, sendMessage, setMessages, status } = useChat({
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
  })

  // restore open state + messages after mount — avoids SSR/client hydration mismatch
  useEffect(() => {
    const stored = readStorage()
    if (stored?.open) setOpen(stored.open)
    if (stored?.messages?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessages(stored.messages as any)
    }
    storageRestoredRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // persist open state + messages whenever they change
  useEffect(() => {
    if (!storageRestoredRef.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, messages }))
    } catch {
      // storage full or disabled — ignore
    }
  }, [open, messages])

  // stamp timestamp when message first appears
  useEffect(() => {
    for (const m of messages) {
      if (!messageTimestamps.has(m.id)) {
        messageTimestamps.set(m.id, Date.now())
      }
    }
  }, [messages, messageTimestamps])

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then(
        (data: { suggestions?: string[]; entities?: EntityLink[]; welcomeText?: string; placeholderText?: string }) => {
          setSuggestions(data.suggestions ?? [])
          if (data.entities?.length) setEntityLinks(data.entities)
          if (data.welcomeText) setWelcomeText(data.welcomeText)
          if (data.placeholderText) setPlaceholderText(data.placeholderText)
        }
      )
      .catch(() => {})
  }, [])

  const toggle = useCallback(() => {
    setOpen((current) => {
      if (!current) void createAnalyticsEvent("assistant_opened", { source: "dock" })
      return !current
    })
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const newChat = useCallback(() => {
    setMessages([])
    setLastCitations(null)
    setLastFollowups([])
    setLastJdText(null)
    setInput("")
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [setMessages])

  const submitQuestion = useCallback(
    (question: string) => {
      if (shouldRecordAssistantQuestion(question)) recordAssistantQuestion(question)
      void createAnalyticsEvent("assistant_question", { query: question, source: "suggestion" })
      const jdMatch = question.match(/Analyse my job fit for this role:\n\n([\s\S]+)/)
      if (jdMatch?.[1]) setLastJdText(jdMatch[1])
      setLastFollowups([])
      void sendMessage({ text: question })
    },
    [sendMessage]
  )

  const submit = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    if (shouldRecordAssistantQuestion(text)) recordAssistantQuestion(text)
    void createAnalyticsEvent("assistant_question", { query: text, source: "input" })
    setInput("")
    setLastFollowups([])
    void sendMessage({ text })
  }, [input, isLoading, sendMessage])

  const chatMessages = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m, index, list) => {
          const isLast = index === list.length - 1
          return {
            id: m.id,
            role: m.role as "user" | "assistant",
            content: getMessageText(m),
            timestamp: messageTimestamps.get(m.id) ?? Date.now(),
            citations:
              m.role === "assistant" && isLast ? lastCitations ?? undefined : undefined,
            followups:
              m.role === "assistant" && isLast && !isLoading
                ? lastFollowups
                : undefined,
          }
        }),
    [messages, lastCitations, lastFollowups, isLoading, messageTimestamps]
  )

  const value: AssistantContextValue = {
    open, toggle, close, newChat,
    lastJdText, input, setInput,
    suggestions, entityLinks, welcomeText, placeholderText,
    messages: chatMessages, isLoading,
    submit, submitQuestion,
  }

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) throw new Error("useAssistant must be used within AssistantProvider")
  return context
}

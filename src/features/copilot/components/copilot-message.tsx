"use client"

import { Copy, ThumbsDown, ThumbsUp } from "lucide-react"
import { useState } from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
} from "@/shared/ui/chain-of-thought"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
} from "@/shared/ui/message"
import { TextShimmer } from "@/shared/ui/text-shimmer"

const ACTION_LOADING_PHRASES = ["Saving your edit", "Cooking up fresh takes"]

const USER_BUBBLE_CLASS =
  "prose-none w-max max-w-[85%] shrink-0 rounded-full px-4 py-2.5 text-sm leading-snug break-normal whitespace-pre-wrap bg-black text-white dark:bg-white dark:text-black"

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function MessageTimestamp({
  createdAt,
  align = "start",
}: {
  createdAt?: string
  align?: "start" | "end"
}) {
  if (!createdAt) return null

  return (
    <time
      className={cn(
        "text-muted-foreground pointer-events-none absolute -top-4 text-[10px] leading-none opacity-0 transition-opacity duration-200 group-hover/message:opacity-100",
        align === "end" ? "right-0" : "left-0"
      )}
      dateTime={createdAt}
    >
      {formatMessageTime(createdAt)}
    </time>
  )
}

function isActionLoadingPlaceholder(content: string): boolean {
  return ACTION_LOADING_PHRASES.some((phrase) => content.includes(phrase))
}

function CopilotThinkingState() {
  return (
    <ChainOfThought>
      <ChainOfThoughtStep defaultOpen>
        <ChainOfThoughtTrigger>Thinking</ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            <TextShimmer duration={2}>Analyzing your request…</TextShimmer>
          </ChainOfThoughtItem>
          <ChainOfThoughtItem>
            <TextShimmer duration={2.5}>Loading portfolio context…</TextShimmer>
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
    </ChainOfThought>
  )
}

export function CopilotUserMessage({
  content,
  createdAt,
}: {
  content: string
  createdAt?: string
}) {
  return (
    <Message className="group/message w-full justify-end">
      <div className="relative flex w-max max-w-[85%] shrink-0 flex-col items-end">
        <MessageTimestamp align="end" createdAt={createdAt} />
        <MessageContent className={USER_BUBBLE_CLASS}>{content}</MessageContent>
      </div>
    </Message>
  )
}

export function CopilotAssistantMessage({
  content,
  createdAt,
  isStreaming,
}: {
  content: string
  createdAt?: string
  isStreaming: boolean
}) {
  const [liked, setLiked] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!content) return
    void navigator.clipboard.writeText(content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const showFeedback =
    Boolean(content) && !isStreaming && !isActionLoadingPlaceholder(content)

  return (
    <Message className="group/message justify-start">
      <MessageAvatar alt="CMS Copilot" className="mt-0.5" fallback="AI" />
      <div className="relative flex w-full min-w-0 flex-col gap-2 pt-0.5">
        <MessageTimestamp createdAt={createdAt} />
        <div className="flex w-full min-w-0 flex-col gap-2">
          {!content && isStreaming ? (
            <CopilotThinkingState />
          ) : isStreaming && isActionLoadingPlaceholder(content) ? (
            <div className="bg-transparent p-0 text-sm leading-relaxed">
              <TextShimmer duration={2}>{content}</TextShimmer>
            </div>
          ) : content ? (
            <MessageContent
              markdown
              className="prose-sm prose-p:my-0 max-w-none bg-transparent p-0 leading-relaxed"
            >
              {content}
            </MessageContent>
          ) : null}

          {showFeedback ? (
            <MessageActions className="mt-1 self-start opacity-0 transition-opacity duration-200 group-hover/message:opacity-100">
              <MessageAction tooltip={copied ? "Copied!" : "Copy to clipboard"}>
                <Button
                  className="size-8 rounded-full"
                  onClick={handleCopy}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Copy className={cn("size-4", copied && "text-green-500")} />
                </Button>
              </MessageAction>

              <MessageAction tooltip="Helpful">
                <Button
                  className={cn(
                    "size-8 rounded-full",
                    liked === true &&
                      "bg-green-100 text-green-500 dark:bg-green-950"
                  )}
                  onClick={() => setLiked(true)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ThumbsUp className="size-4" />
                </Button>
              </MessageAction>

              <MessageAction tooltip="Not helpful">
                <Button
                  className={cn(
                    "size-8 rounded-full",
                    liked === false && "bg-red-100 text-red-500 dark:bg-red-950"
                  )}
                  onClick={() => setLiked(false)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ThumbsDown className="size-4" />
                </Button>
              </MessageAction>
            </MessageActions>
          ) : null}
        </div>
      </div>
    </Message>
  )
}

"use client"

import { ErrorAlert } from "@/components/shared/error-alert"
import type { AssistantChatErrorDisplay } from "@/lib/public/assistant-chat-error"

type AssistantChatErrorProps = {
  error: AssistantChatErrorDisplay
  onRetry?: () => void
  onDismiss: () => void
  className?: string
}

export function AssistantChatError({
  error,
  onRetry,
  onDismiss,
  className,
}: AssistantChatErrorProps) {
  return (
    <ErrorAlert
      className={className}
      error={error}
      onDismiss={onDismiss}
      onRetry={onRetry}
    />
  )
}

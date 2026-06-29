"use client"

import type { AssistantChatErrorDisplay } from "@/features/portfolio/lib/assistant-chat-error"
import { ErrorAlert } from "@/shared/components/error-alert"

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

import { getISTSecond } from "@/features/portfolio/lib/workspace-utils"

import type { ContextMessage, WorkspaceContext } from "./types"

export function getFifteenMinuteBucket(minute: number): number {
  return Math.floor(minute / 15)
}

export function getRotationSeed(context: WorkspaceContext, salt = 0): number {
  const bucket = getFifteenMinuteBucket(context.minute)
  return context.day * 10_000 + context.hour * 100 + bucket * 10 + salt
}

export function pickWeightedMessage(
  messages: ContextMessage[],
  seed: number
): string {
  if (messages.length === 0) {
    return ""
  }

  const totalWeight = messages.reduce((sum, message) => sum + message.weight, 0)
  if (totalWeight <= 0) {
    return messages[0]?.text ?? ""
  }

  let remainder = Math.abs(seed) % totalWeight

  for (const message of messages) {
    remainder -= message.weight
    if (remainder < 0) {
      return message.text
    }
  }

  return messages[messages.length - 1]?.text ?? ""
}

export function pickDeterministicMessage(
  messages: ContextMessage[],
  context: WorkspaceContext,
  salt = 0
): string {
  return pickWeightedMessage(messages, getRotationSeed(context, salt))
}

export function pickDeterministicMessages(
  messages: ContextMessage[],
  context: WorkspaceContext,
  count: number
): string[] {
  const results: string[] = []
  const seen = new Set<string>()

  for (
    let salt = 0;
    salt < messages.length + count && results.length < count;
    salt += 1
  ) {
    const message = pickDeterministicMessage(messages, context, salt)
    if (message && !seen.has(message)) {
      seen.add(message)
      results.push(message)
    }
  }

  return results
}

export function msUntilNextBucket(context: WorkspaceContext): number {
  const minuteInBucket = context.minute % 15
  const minutesLeft = 14 - minuteInBucket
  const seconds = getISTSecond(context.now)
  const secondsLeft = minutesLeft * 60 + (60 - seconds)
  return Math.max(secondsLeft, 1) * 1000
}

import type { DiscoveryDocument } from "@/lib/discovery/types"

import {
  appendAssistantQuestion,
  appendSearchQuery,
  writeRecentlyViewed,
} from "./storage"

export function recordContentView(document: DiscoveryDocument): void {
  writeRecentlyViewed(document)
}

export function recordSearchQuery(query: string, resultCount?: number): void {
  appendSearchQuery(query, resultCount)
}

export function recordAssistantQuestion(query: string): void {
  appendAssistantQuestion(query)
}

export function recordContentViewByPath(
  pathname: string,
  documents: DiscoveryDocument[]
): DiscoveryDocument | null {
  const normalizedPath = normalizePath(pathname)
  const match = documents.find(
    (document) => normalizePath(new URL(document.url, "http://local").pathname) === normalizedPath
  )

  if (!match) {
    return null
  }

  recordContentView(match)
  return match
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

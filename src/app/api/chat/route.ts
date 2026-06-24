import { NextResponse } from "next/server"

import {
  createPublicAssistantStreamResponse,
  generateSuggestedQuestions,
  isAiConfigured,
  retrievePortfolioContext,
} from "@/lib/ai"
import { getAiSettings } from "@/lib/ai/get-ai-settings"
import { trackServerEvent } from "@/lib/analytics/posthog-server"
import {
  getPublicSettings,
  getPublishedContent,
  getPublishedExpertiseAreas,
  getPublishedProjects,
} from "@/lib/public/queries"
import { rateLimitRequest } from "@/lib/security/api-route"
import { parseChatPostBody } from "@/lib/security/chat-request"
import { resolveSiteUrl } from "@/lib/seo/canonical"

export const maxDuration = 60

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, "chat")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  if (!(await isAiConfigured())) {
    return NextResponse.json(
      {
        error:
          "Portfolio assistant is not configured. Add an AI provider API key.",
      },
      { status: 503, headers: rateLimit.headers }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const parsedBody = parseChatPostBody(rawBody)
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const { messages, queryText } = parsedBody.data

  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  if (!siteUrl) {
    return NextResponse.json(
      { error: "Site URL not configured." },
      { status: 503, headers: rateLimit.headers }
    )
  }

  void trackServerEvent("anonymous", "chat_request", {
    query_length: queryText.length,
    message_count: messages.length,
  })

  const retrieval = await retrievePortfolioContext(siteUrl, queryText)
  const suggestions = await generateSuggestedQuestions(siteUrl)

  return createPublicAssistantStreamResponse(
    {
      messages,
      contextText: retrieval.contextText,
      citations: retrieval.citations,
      suggestions,
    },
    rateLimit.headers
  )
}

export async function GET(request: Request) {
  const rateLimit = await rateLimitRequest(request, "chat")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const [publicSettings, aiSettings] = await Promise.all([
    getPublicSettings(),
    getAiSettings(),
  ])
  const siteUrl = resolveSiteUrl(publicSettings.site.site_url)

  if (!siteUrl) {
    return NextResponse.json(
      {
        suggestions: [],
        welcomeText: aiSettings.assistant_welcome_text,
        placeholderText: aiSettings.assistant_placeholder_text,
      },
      { headers: rateLimit.headers }
    )
  }

  const [
    suggestions,
    projectsResult,
    researchResult,
    blogResult,
    expertiseResult,
  ] = await Promise.all([
    generateSuggestedQuestions(siteUrl),
    getPublishedProjects(),
    getPublishedContent({ type: "research" }),
    getPublishedContent({ type: "blog" }),
    getPublishedExpertiseAreas(),
  ])

  // title → relative path map for client-side linkification
  const entities: Array<{ title: string; path: string }> = [
    ...(projectsResult.data ?? []).map((p) => ({
      title: p.title,
      path: `/projects/${p.slug}`,
    })),
    ...(researchResult.data ?? []).map((c) => ({
      title: c.title,
      path: `/research/${c.slug}`,
    })),
    ...(blogResult.data ?? []).map((c) => ({
      title: c.title,
      path: `/blog/${c.slug}`,
    })),
    ...(expertiseResult.data ?? []).map((a) => ({
      title: a.title,
      path: `/expertise/${a.slug}`,
    })),
  ]

  return NextResponse.json(
    {
      suggestions,
      entities,
      welcomeText: aiSettings.assistant_welcome_text,
      placeholderText: aiSettings.assistant_placeholder_text,
      calendlyUrl: publicSettings.contact.calendly_url ?? null,
    },
    { headers: rateLimit.headers }
  )
}

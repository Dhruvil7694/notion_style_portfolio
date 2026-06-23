export type AnalyticsEventName =
  | "project_view"
  | "research_view"
  | "article_view"
  | "automation_view"
  | "resume_download"
  | "contact_click"
  | "expertise_view"
  | "technology_view"
  | "faq_expand"
  | "related_content_click"
  | "knowledge_graph_navigation"
  | "search_opened"
  | "search_query"
  | "search_result_click"
  | "explore_navigation"
  | "entity_navigation"
  | "assistant_opened"
  | "assistant_question"
  | "assistant_source_click"
  | "assistant_job_fit_mode"
  | "assistant_job_fit"
  | "assistant_job_fit_pdf"
  | "jd_classification_feedback"
  | "copilot_opened"
  | "copilot_tool_invoked"
  | "copilot_audit_run"
  | "copilot_content_generated"

export type AnalyticsEventPayload = {
  project_view: {
    slug: string
    title: string
  }
  research_view: {
    slug: string
    title: string
  }
  article_view: {
    slug: string
    title: string
  }
  automation_view: {
    slug: string
    title: string
  }
  resume_download: {
    source: "resume_page" | "homepage" | "footer" | "dock"
  }
  contact_click: {
    channel: "email" | "calendly" | "social"
    target?: string
  }
  expertise_view: {
    slug: string
    title: string
  }
  technology_view: {
    slug: string
    title: string
  }
  faq_expand: {
    pageType: "project" | "research" | "writing" | "automation"
    slug: string
    question: string
  }
  related_content_click: {
    sourceType: string
    sourceSlug: string
    targetType: string
    targetSlug: string
  }
  knowledge_graph_navigation: {
    from: string
    to: string
    linkType: "expertise" | "technology" | "related"
  }
  search_opened: {
    source: "keyboard" | "header" | "search_page" | "dock"
  }
  search_query: {
    query: string
    resultCount: number
  }
  search_result_click: {
    query: string
    resultType: string
    resultSlug: string
    resultTitle: string
    position: number
  }
  explore_navigation: {
    section: string
    targetType?: string
    targetSlug?: string
  }
  entity_navigation: {
    sourceType: string
    sourceSlug: string
    targetType: string
    targetSlug: string
    linkCategory: "expertise" | "technology" | "concept" | "content"
  }
  assistant_opened: {
    source: "floating_button" | "keyboard" | "dock"
  }
  assistant_question: {
    query: string
    source?: "suggestion" | "input"
  }
  assistant_source_click: {
    sourceId: string
    sourceTitle: string
    sourceUrl: string
  }
  assistant_job_fit_mode: {
    source: "header" | "dock"
  }
  assistant_job_fit: {
    jd_length: number
  }
  assistant_job_fit_pdf: {
    filename: string
  }
  jd_classification_feedback: {
    content_hash: string
    predicted_document_type: string
    confidence: number
    was_valid: boolean
    role_title?: string | null
  }
  copilot_opened: Record<string, never>
  copilot_tool_invoked: {
    tool: string
  }
  copilot_audit_run: {
    scope: "portfolio" | "project"
  }
  copilot_content_generated: {
    type: string
    entitySlug?: string
  }
}

export type AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> =
  {
    name: T
    payload: AnalyticsEventPayload[T]
    timestamp?: string
  }

export const ANALYTICS_EVENTS: Record<AnalyticsEventName, AnalyticsEventName> =
  {
    project_view: "project_view",
    research_view: "research_view",
    article_view: "article_view",
    automation_view: "automation_view",
    resume_download: "resume_download",
    contact_click: "contact_click",
    expertise_view: "expertise_view",
    technology_view: "technology_view",
    faq_expand: "faq_expand",
    related_content_click: "related_content_click",
    knowledge_graph_navigation: "knowledge_graph_navigation",
    search_opened: "search_opened",
    search_query: "search_query",
    search_result_click: "search_result_click",
    explore_navigation: "explore_navigation",
    entity_navigation: "entity_navigation",
    assistant_opened: "assistant_opened",
    assistant_question: "assistant_question",
    assistant_source_click: "assistant_source_click",
    assistant_job_fit_mode: "assistant_job_fit_mode",
    assistant_job_fit: "assistant_job_fit",
    assistant_job_fit_pdf: "assistant_job_fit_pdf",
    jd_classification_feedback: "jd_classification_feedback",
    copilot_opened: "copilot_opened",
    copilot_tool_invoked: "copilot_tool_invoked",
    copilot_audit_run: "copilot_audit_run",
    copilot_content_generated: "copilot_content_generated",
  }

export function createAnalyticsEvent<T extends AnalyticsEventName>(
  name: T,
  payload: AnalyticsEventPayload[T],
  timestamp = new Date().toISOString()
): AnalyticsEvent<T> {
  return { name, payload, timestamp }
}

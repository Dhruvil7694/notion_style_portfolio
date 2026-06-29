import {
  AlertCircle,
  BarChart3,
  CircleDollarSign,
  LayoutDashboard,
  List,
} from "lucide-react"

export const AI_USAGE_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Summary stats and charts",
    icon: LayoutDashboard,
  },
  {
    id: "queries",
    label: "Query log",
    description: "Per-request costs and breakdown",
    icon: List,
  },
  {
    id: "costs",
    label: "Costing",
    description: "Verification and provider totals",
    icon: CircleDollarSign,
  },
  {
    id: "analysis",
    label: "Analysis",
    description: "Model, role, and daily breakdowns",
    icon: BarChart3,
  },
  {
    id: "errors",
    label: "Errors",
    description: "Recent failed requests",
    icon: AlertCircle,
  },
] as const

export type AiUsageTabId = (typeof AI_USAGE_TABS)[number]["id"]

const TAB_IDS = new Set<string>(AI_USAGE_TABS.map((tab) => tab.id))

export function parseAiUsageTab(value: string | undefined): AiUsageTabId {
  if (value && TAB_IDS.has(value)) {
    return value as AiUsageTabId
  }
  return "overview"
}

export function aiUsageTabHref(tab: AiUsageTabId, queryPage?: number): string {
  const params = new URLSearchParams()
  if (tab !== "overview") {
    params.set("tab", tab)
  }
  if (tab === "queries" && queryPage && queryPage > 1) {
    params.set("qPage", String(queryPage))
  }
  const query = params.toString()
  return query ? `/admin/ai?${query}` : "/admin/ai"
}

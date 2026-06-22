import { BarChart3 } from "lucide-react"

import { KbSection } from "@/components/public/kb-section"
import { ProofMetricsList } from "@/components/public/proof-metrics-list"
import type { MetricPreviewContext } from "@/lib/public/metric-previews"
import type { SiteSettings } from "@/lib/public/settings"

type ProofSectionProps = {
  metrics: SiteSettings["selected_metrics"]
  previewContext: MetricPreviewContext
}

export function ProofSection({ metrics, previewContext }: ProofSectionProps) {
  const items = metrics.filter((metric) => metric.trim())

  if (items.length === 0) {
    return null
  }

  return (
    <KbSection className="proof-section" icon={BarChart3} title="Selected Metrics">
      <ProofMetricsList context={previewContext} metrics={items} />
    </KbSection>
  )
}

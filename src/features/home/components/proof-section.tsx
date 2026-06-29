import { BarChart3 } from "lucide-react"

import { ProofMetricsList } from "@/features/home/components/proof-metrics-list"
import { KbSection } from "@/features/knowledge-base/components/kb-section"
import type { MetricPreviewContext } from "@/features/portfolio/lib/metric-previews"
import type { SiteSettings } from "@/features/portfolio/lib/settings"

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
    <KbSection
      className="proof-section"
      icon={BarChart3}
      title="Selected Metrics"
    >
      <ProofMetricsList context={previewContext} metrics={items} />
    </KbSection>
  )
}

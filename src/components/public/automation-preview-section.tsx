import { Workflow } from "lucide-react"
import Link from "next/link"

import {
  AutomationList,
  type AutomationListItem,
} from "@/components/public/automation-list"
import { PublicEmptyState } from "@/components/public/empty-state"

type AutomationPreviewSectionProps = {
  items: AutomationListItem[]
}

export function AutomationPreviewSection({
  items,
}: AutomationPreviewSectionProps) {
  return (
    <section className="automations-section kb-section mx-auto max-w-home px-page">
      <header className="automations-section-header">
        <h2 className="automations-section-title">
          <Workflow
            aria-hidden
            className="automations-section-icon"
            strokeWidth={1.75}
          />
          Automations
        </h2>
        <p className="automations-section-description">
          Workflows and operational systems built for efficiency.
        </p>
      </header>

      {items.length > 0 ? (
        <>
          <AutomationList items={items} />

          <Link className="automations-section-more" href="/automations">
            View all automations
          </Link>
        </>
      ) : (
        <PublicEmptyState message="Automation write-ups will appear here as they are published." />
      )}
    </section>
  )
}

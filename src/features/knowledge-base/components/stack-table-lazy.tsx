"use client"

import dynamic from "next/dynamic"

import type { SkillDetailRow } from "@/features/portfolio/lib/skill-usage"
import { PageLoadingShell } from "@/features/site-shell/components/page-loading-shell"

const StackTableImpl = dynamic(
  () =>
    import("@/features/knowledge-base/components/stack-table").then(
      (module) => ({
        default: module.StackTable,
      })
    ),
  {
    ssr: false,
    loading: () => <PageLoadingShell rows={10} />,
  }
)

type StackTableLazyProps = {
  rows: SkillDetailRow[]
}

export function StackTableLazy({ rows }: StackTableLazyProps) {
  return <StackTableImpl rows={rows} />
}

"use client"

import dynamic from "next/dynamic"

import { PageLoadingShell } from "@/components/public/page-loading-shell"
import type { SkillDetailRow } from "@/lib/public/skill-usage"

const StackTableImpl = dynamic(
  () =>
    import("@/components/public/stack-table").then((module) => ({
      default: module.StackTable,
    })),
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

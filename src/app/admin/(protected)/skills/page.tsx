import { Suspense } from "react"

import { SkillsListPanel } from "@/features/admin/components/skills-list-panel"
import { getSkillsList } from "@/features/admin/lib/queries"

export const metadata = {
  title: "Skills",
  robots: { index: false, follow: false },
}

type AdminSkillsPageProps = {
  searchParams: Promise<{ q?: string; create?: string }>
}

export default async function AdminSkillsPage({
  searchParams,
}: AdminSkillsPageProps) {
  const params = await searchParams
  const { data: skills, error } = await getSkillsList({ q: params.q })

  return (
    <Suspense fallback={null}>
      <SkillsListPanel
        errorMessage={error?.message}
        initialCreateOpen={params.create === "1"}
        skills={skills ?? []}
      />
    </Suspense>
  )
}

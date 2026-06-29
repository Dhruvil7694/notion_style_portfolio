import { Suspense } from "react"

import { EducationListPanel } from "@/features/admin/components/education-list-panel"
import { getEducationList } from "@/features/admin/lib/queries"

export const metadata = {
  title: "Education",
  robots: { index: false, follow: false },
}

type AdminEducationPageProps = {
  searchParams: Promise<{ q?: string; create?: string }>
}

export default async function AdminEducationPage({
  searchParams,
}: AdminEducationPageProps) {
  const params = await searchParams
  const { data: education, error } = await getEducationList({ q: params.q })

  return (
    <Suspense fallback={null}>
      <EducationListPanel
        education={education ?? []}
        errorMessage={error?.message}
        initialCreateOpen={params.create === "1"}
      />
    </Suspense>
  )
}

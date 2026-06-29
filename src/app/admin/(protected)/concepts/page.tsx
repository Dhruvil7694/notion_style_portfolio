import { Suspense } from "react"

import { ConceptsListPanel } from "@/features/admin/components/concepts-list-panel"
import { getConceptsList } from "@/features/admin/lib/queries"

export const metadata = {
  title: "Concepts",
  robots: { index: false, follow: false },
}

type AdminConceptsPageProps = {
  searchParams: Promise<{ q?: string; create?: string }>
}

export default async function AdminConceptsPage({
  searchParams,
}: AdminConceptsPageProps) {
  const params = await searchParams
  const { data: items, error } = await getConceptsList({ q: params.q })

  return (
    <Suspense fallback={null}>
      <ConceptsListPanel
        concepts={items ?? []}
        errorMessage={error?.message}
        initialCreateOpen={params.create === "1"}
      />
    </Suspense>
  )
}

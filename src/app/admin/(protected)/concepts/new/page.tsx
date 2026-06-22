import { ConceptForm } from "@/features/admin/forms/concept-form"

export const metadata = {
  title: "New Concept",
  robots: { index: false, follow: false },
}

export default function AdminNewConceptPage() {
  return <ConceptForm mode="create" />
}

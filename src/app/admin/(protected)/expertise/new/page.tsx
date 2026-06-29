import { ExpertiseForm } from "@/features/admin/components/forms/expertise-form"

export const metadata = {
  title: "New Expertise",
  robots: { index: false, follow: false },
}

export default function AdminNewExpertisePage() {
  return <ExpertiseForm mode="create" />
}

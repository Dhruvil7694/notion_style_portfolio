import { TechnologyForm } from "@/features/admin/forms/technology-form"

export const metadata = {
  title: "New Technology",
  robots: { index: false, follow: false },
}

export default function AdminNewTechnologyPage() {
  return <TechnologyForm mode="create" />
}

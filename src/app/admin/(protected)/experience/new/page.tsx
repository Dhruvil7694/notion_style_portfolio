import { ExperienceForm } from "@/features/admin/forms/experience-form"

export const metadata = {
  title: "New Experience",
  robots: { index: false, follow: false },
}

export default function AdminNewExperiencePage() {
  return <ExperienceForm mode="create" />
}

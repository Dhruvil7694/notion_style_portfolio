import { EducationForm } from "@/features/admin/forms/education-form"

export const metadata = {
  title: "New Education",
  robots: { index: false, follow: false },
}

export default function AdminNewEducationPage() {
  return <EducationForm mode="create" />
}

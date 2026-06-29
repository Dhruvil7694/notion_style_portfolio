import { ProjectForm } from "@/features/admin/components/forms/project-form"

export const metadata = {
  title: "New Project",
  robots: { index: false, follow: false },
}

export default function AdminNewProjectPage() {
  return <ProjectForm mode="create" />
}

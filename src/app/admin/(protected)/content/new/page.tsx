import { ContentForm } from "@/features/admin/components/forms/content-form"

export const metadata = {
  title: "New Content",
  robots: { index: false, follow: false },
}

export default function AdminNewContentPage() {
  return <ContentForm mode="create" />
}

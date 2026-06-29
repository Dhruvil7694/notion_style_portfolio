import { redirect } from "next/navigation"

export const metadata = {
  title: "New Concept",
  robots: { index: false, follow: false },
}

export default function AdminNewConceptPage() {
  redirect("/admin/concepts?create=1")
}

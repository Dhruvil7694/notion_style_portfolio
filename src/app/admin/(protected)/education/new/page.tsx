import { redirect } from "next/navigation"

export const metadata = {
  title: "New Education",
  robots: { index: false, follow: false },
}

export default function AdminNewEducationPage() {
  redirect("/admin/education?create=1")
}

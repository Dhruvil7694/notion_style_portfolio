import { redirect } from "next/navigation"

export const metadata = {
  title: "New Skill",
  robots: { index: false, follow: false },
}

export default function AdminNewSkillPage() {
  redirect("/admin/skills?create=1")
}

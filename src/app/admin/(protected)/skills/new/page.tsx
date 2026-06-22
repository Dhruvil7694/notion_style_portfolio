import { SkillForm } from "@/features/admin/forms/skill-form"

export const metadata = {
  title: "New Skill",
  robots: { index: false, follow: false },
}

export default function AdminNewSkillPage() {
  return <SkillForm mode="create" />
}

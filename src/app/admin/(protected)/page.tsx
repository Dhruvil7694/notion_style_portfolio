import {
  PageHeader,
  StatCard,
} from "@/components/admin"
import { getDashboardStats } from "@/lib/admin/queries"
import { formatDateTime } from "@/lib/utils"

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      <PageHeader
        description="Overview of portfolio content and CMS activity."
        title="Dashboard"
      />

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Projects</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Projects" value={stats.projects.total} />
          <StatCard label="Published Projects" value={stats.projects.published} />
          <StatCard label="Draft Projects" value={stats.projects.draft} />
          <StatCard
            hint={`${stats.projects.archived} archived`}
            label="Archived Projects"
            value={stats.projects.archived}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Content</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Content" value={stats.content.total} />
          <StatCard label="Blogs" value={stats.content.blog} />
          <StatCard label="Research" value={stats.content.research} />
          <StatCard label="Automation" value={stats.content.automation} />
          <StatCard label="Notes" value={stats.content.note} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Resume</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Current Version"
            value={stats.resume.currentVersion ?? "—"}
          />
          <StatCard
            label="Total Versions"
            value={stats.resume.total}
          />
          <StatCard
            label="Last Upload"
            value={
              stats.resume.lastUploadDate
                ? formatDateTime(stats.resume.lastUploadDate)
                : "—"
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Collections</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Experience Entries" value={stats.experience} />
          <StatCard label="Skills" value={stats.skills} />
          <StatCard label="Education Entries" value={stats.education} />
        </div>
      </section>
    </div>
  )
}

import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  LayoutGrid,
  ScrollText,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { PageHeader, StatusBadge } from "@/features/admin/components"
import {
  ContentTypeDonut,
  ProjectStatusBars,
  SkillCategoryBars,
} from "@/features/admin/components/dashboard-charts"
import {
  DashboardHealthSection,
  DashboardHealthSectionSkeleton,
} from "@/features/admin/components/dashboard-health-section"
import { RefreshButton } from "@/features/admin/components/refresh-button"
import { getDashboardStats } from "@/features/admin/lib/queries"
import { cn, formatDateTime } from "@/shared/lib/utils"

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  href: string
  accent?: "blue" | "emerald" | "amber" | "purple" | "rose" | "slate"
}) {
  const accentClasses: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    rose: "text-rose-500 bg-rose-500/10",
    slate: "text-slate-500 bg-slate-500/10",
  }
  const iconClass = accentClasses[accent ?? "slate"]

  return (
    <Link
      className="bg-card/40 border-border/60 group flex items-center gap-4 rounded-xl border p-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/70"
      href={href}
    >
      <div className={cn("rounded-lg p-2.5", iconClass)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        {sub ? (
          <p className="text-muted-foreground truncate text-xs">{sub}</p>
        ) : null}
      </div>
      <ChevronRight className="text-muted-foreground/40 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function ChartSection({
  title,
  description,
  children,
  empty,
}: {
  title: string
  description: string
  children: React.ReactNode
  empty?: boolean
}) {
  return (
    <div className="bg-card/40 border-border/60 space-y-3 rounded-xl border p-5 shadow-sm backdrop-blur-sm">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      {empty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <LayoutGrid className="text-muted-foreground/30 size-8" />
          <p className="text-muted-foreground text-xs">No data yet</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function ContentTypeLegend({
  items,
}: {
  items: { label: string; count: number; color: string }[]
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <div className="flex items-center gap-1.5" key={item.label}>
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground text-xs">
            {item.label}{" "}
            <span className="text-foreground font-medium">{item.count}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function RecentItem({
  title,
  meta,
  status,
  time,
  href,
}: {
  title: string
  meta: string
  status: string
  time: string
  href: string
}) {
  return (
    <Link
      className="hover:bg-muted/40 group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
      href={href}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs capitalize">
          {meta}
        </p>
      </div>
      <StatusBadge className="shrink-0" value={status} />
      <span className="text-muted-foreground/60 shrink-0 text-xs">{time}</span>
    </Link>
  )
}

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  const diffMo = Math.floor(diffDay / 30)
  return `${diffMo}mo ago`
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  const contentTypeData = [
    { type: "blog", count: stats.content.blog },
    { type: "research", count: stats.content.research },
    { type: "automation", count: stats.content.automation },
    { type: "note", count: stats.content.note },
    { type: "publication", count: stats.content.publication },
  ]

  const contentTypeLegend = [
    { label: "Blog", count: stats.content.blog, color: "var(--chart-1)" },
    {
      label: "Research",
      count: stats.content.research,
      color: "var(--chart-2)",
    },
    {
      label: "Automation",
      count: stats.content.automation,
      color: "var(--chart-3)",
    },
    { label: "Note", count: stats.content.note, color: "var(--chart-4)" },
    {
      label: "Publication",
      count: stats.content.publication,
      color: "var(--chart-5)",
    },
  ].filter((l) => l.count > 0)

  const projectStatusData = [
    { status: "published", count: stats.projects.published },
    { status: "draft", count: stats.projects.draft },
    { status: "archived", count: stats.projects.archived },
  ]

  const projectPublishRate =
    stats.projects.total > 0
      ? Math.round((stats.projects.published / stats.projects.total) * 100)
      : 0

  return (
    <div className="space-y-8">
      <PageHeader
        description="Portfolio command center — content, projects, and quick access to all sections."
        title="Dashboard"
      />

      {/* Draft warning */}
      {stats.projects.draft + stats.content.byStatus.draft >= 3 ? (
        <div className="bg-amber-500/8 border-amber-500/20 flex items-start gap-3 rounded-xl border px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {stats.projects.draft + stats.content.byStatus.draft} unpublished
              drafts
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {stats.projects.draft > 0
                ? `${stats.projects.draft} project${stats.projects.draft !== 1 ? "s" : ""}`
                : ""}
              {stats.projects.draft > 0 && stats.content.byStatus.draft > 0
                ? " and "
                : ""}
              {stats.content.byStatus.draft > 0
                ? `${stats.content.byStatus.draft} content item${stats.content.byStatus.draft !== 1 ? "s" : ""}`
                : ""}{" "}
              waiting to be published.
            </p>
          </div>
          <Link
            className="shrink-0 text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
            href="/admin/content?status=draft"
          >
            Review
          </Link>
        </div>
      ) : null}

      {/* KPI Cards */}
      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            accent="blue"
            href="/admin/projects"
            icon={Briefcase}
            label="Projects"
            sub={`${projectPublishRate}% published`}
            value={stats.projects.total}
          />
          <KpiCard
            accent="emerald"
            href="/admin/content"
            icon={FileText}
            label="Content"
            sub={`${stats.contentPublishedRate}% published`}
            value={stats.content.total}
          />
          <KpiCard
            accent="purple"
            href="/admin/experience"
            icon={BookOpen}
            label="Experience"
            sub="work entries"
            value={stats.experience}
          />
          <KpiCard
            accent="amber"
            href="/admin/skills"
            icon={Wrench}
            label="Skills"
            sub={`${stats.skillsByCategory.length} categories`}
            value={stats.skills}
          />
          <KpiCard
            accent="rose"
            href="/admin/education"
            icon={GraduationCap}
            label="Education"
            sub="institutions"
            value={stats.education}
          />
          <KpiCard
            accent="slate"
            href="/admin/resume"
            icon={ScrollText}
            label="Resume"
            sub={
              stats.resume.lastUploadDate
                ? `Updated ${relativeTime(stats.resume.lastUploadDate)}`
                : "No uploads yet"
            }
            value={stats.resume.currentVersion ?? "—"}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Insights
        </h2>
        <div className="grid gap-4 xl:grid-cols-3">
          <ChartSection
            description={`${stats.content.total} items across ${contentTypeLegend.length} types`}
            empty={stats.content.total === 0}
            title="Content by type"
          >
            <ContentTypeDonut data={contentTypeData} />
            <ContentTypeLegend items={contentTypeLegend} />
          </ChartSection>

          <ChartSection
            description={`${stats.projects.total} total — ${stats.projects.published} published, ${stats.projects.draft} draft`}
            empty={stats.projects.total === 0}
            title="Projects by status"
          >
            <ProjectStatusBars data={projectStatusData} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {projectStatusData
                .filter((d) => d.count > 0)
                .map((d) => (
                  <div className="text-center" key={d.status}>
                    <p className="text-lg font-semibold">{d.count}</p>
                    <p className="text-muted-foreground text-xs capitalize">
                      {d.status}
                    </p>
                  </div>
                ))}
            </div>
          </ChartSection>

          <ChartSection
            description={`${stats.skills} skills across ${stats.skillsByCategory.length} categories`}
            empty={stats.skills === 0}
            title="Skills by category"
          >
            <SkillCategoryBars data={stats.skillsByCategory} />
          </ChartSection>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Recent Activity
        </h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {/* Recent Projects */}
          <div className="bg-card/40 border-border/60 rounded-xl border shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-inherit px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold">Recent Projects</h3>
                <p className="text-muted-foreground text-xs">
                  Last updated first
                </p>
              </div>
              <Link
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                href="/admin/projects"
              >
                View all <ChevronRight className="size-3" />
              </Link>
            </div>
            <div className="p-3">
              {stats.recentProjects.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No projects yet.
                </p>
              ) : (
                stats.recentProjects.map((project) => (
                  <RecentItem
                    href={`/admin/projects/${project.id}`}
                    key={project.id}
                    meta="project"
                    status={project.status}
                    time={relativeTime(project.updated_at)}
                    title={project.title}
                  />
                ))
              )}
            </div>
          </div>

          {/* Recent Content */}
          <div className="bg-card/40 border-border/60 rounded-xl border shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-inherit px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold">Recent Content</h3>
                <p className="text-muted-foreground text-xs">
                  Last updated first
                </p>
              </div>
              <Link
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                href="/admin/content"
              >
                View all <ChevronRight className="size-3" />
              </Link>
            </div>
            <div className="p-3">
              {stats.recentContent.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No content yet.
                </p>
              ) : (
                stats.recentContent.map((item) => (
                  <RecentItem
                    href={`/admin/content/${item.id}`}
                    key={item.id}
                    meta={item.type}
                    status={item.status}
                    time={relativeTime(item.updated_at)}
                    title={item.title}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Visibility & Debug Health */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Health
          </h2>
          <RefreshButton />
        </div>
        <div className="bg-card/40 border-border/60 rounded-xl border p-5 shadow-sm backdrop-blur-sm">
          <Suspense fallback={<DashboardHealthSectionSkeleton />}>
            <DashboardHealthSection
              stats={{
                projects: stats.projects,
                content: {
                  total: stats.content.total,
                  byStatus: stats.content.byStatus,
                },
                skills: stats.skills,
                contentPublishedRate: stats.contentPublishedRate,
              }}
            />
          </Suspense>
        </div>
      </section>

      {/* Footer meta */}
      <div className="flex items-center gap-1.5 pb-2">
        <Clock className="text-muted-foreground/50 size-3" />
        <p className="text-muted-foreground/50 text-xs">
          Data as of {formatDateTime(new Date().toISOString())}
        </p>
      </div>
    </div>
  )
}

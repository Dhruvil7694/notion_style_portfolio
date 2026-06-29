import { AboutPageContent } from "@/features/about/components/about-page-content"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { PageBreadcrumbs } from "@/features/site-shell/components/page-breadcrumbs"
import { createPageMetadata } from "@/shared/lib/utils/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()
  const name = settings.site.owner_name || settings.site.site_name

  return createPageMetadata({
    title: "About",
    description: `More about ${name}: AI systems, RAG, agent workflows, and building things that ship.`,
    path: "/about",
    siteName: settings.site.site_name,
    siteUrl: settings.site.site_url,
  })
}

export default async function AboutPage() {
  const settings = await getPublicSettings()
  const name = settings.site.owner_name || settings.site.site_name

  return (
    <section className="about-page-section kb-section kb-section-first">
      <div className="workspace-profile-layout">
        <div className="about-page-inner">
          <PageBreadcrumbs currentLabel="About Me" />
          <h1 className="about-page-title">About Me</h1>
          <AboutPageContent
            about={settings.about}
            avatarUrl={
              settings.site.owner_avatar_about ??
              settings.site.owner_avatar_original
            }
            ownerName={name}
          />
        </div>
      </div>
    </section>
  )
}

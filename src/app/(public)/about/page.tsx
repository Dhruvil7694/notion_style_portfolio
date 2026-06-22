import { AboutPageContent } from "@/components/public/about-page-content"
import { PageBreadcrumbs } from "@/components/public/page-breadcrumbs"
import { getPublicSettings } from "@/lib/public/queries"
import { createPageMetadata } from "@/lib/utils/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()
  const name = settings.site.owner_name || settings.site.site_name

  return createPageMetadata({
    title: `About — ${name}`,
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
              settings.site.owner_avatar_about ?? settings.site.owner_avatar_original
            }
            ownerName={name}
          />
        </div>
      </div>
    </section>
  )
}

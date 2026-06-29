import { HomePageContent } from "@/features/home/components/home-page-content"
import {
  getActiveResume,
  getExperienceList,
  getPublicSettings,
  getPublishedContent,
  getPublishedProjects,
  getSkillsList,
} from "@/features/portfolio/lib/queries"
import { resolveProfileAvatarSrc } from "@/features/portfolio/lib/settings"
import { AgentDiscoveryLinks } from "@/features/seo/components/agent-discovery-links"
import { HomeLcpPreloadLink } from "@/features/seo/components/home-lcp-preload-link"
import { JsonLd } from "@/features/seo/components/json-ld"
import {
  buildHomeMetadata,
  buildOrganizationJsonLd,
  buildPersonJsonLd,
  buildWebsiteJsonLd,
  mergeJsonLdGraph,
  resolveSiteUrl,
} from "@/features/seo/lib"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildHomeMetadata({ settings })
}

const FEATURED_PROJECT_LIMIT = 5
const KNOWLEDGE_PREVIEW_LIMIT = 3

export default async function HomePage() {
  const [
    settings,
    { data: allProjects },
    { data: experience },
    { data: skills },
    { data: allResearch },
    { data: automations },
    { data: writing },
    resume,
  ] = await Promise.all([
    getPublicSettings(),
    getPublishedProjects(),
    getExperienceList(),
    getSkillsList(),
    getPublishedContent({ type: "research" }),
    getPublishedContent({ type: "automation", limit: KNOWLEDGE_PREVIEW_LIMIT }),
    getPublishedContent({ type: "blog", limit: KNOWLEDGE_PREVIEW_LIMIT }),
    getActiveResume(),
  ])

  const featuredProjects = (allProjects ?? [])
    .filter((project) => project.featured)
    .slice(0, FEATURED_PROJECT_LIMIT)
  const research = (allResearch ?? []).slice(0, KNOWLEDGE_PREVIEW_LIMIT)

  const siteUrl = resolveSiteUrl(settings.site.site_url)
  const avatarSrc = resolveProfileAvatarSrc(settings.site)
  const jsonLd = siteUrl
    ? mergeJsonLdGraph([
        buildPersonJsonLd(settings, siteUrl),
        buildOrganizationJsonLd(settings, siteUrl),
        buildWebsiteJsonLd(settings, siteUrl),
      ])
    : null

  return (
    <>
      <AgentDiscoveryLinks />
      <HomeLcpPreloadLink avatarSrc={avatarSrc} />
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <HomePageContent
        allResearch={allResearch}
        automations={automations}
        experience={experience}
        metricProjects={allProjects}
        projects={featuredProjects}
        research={research}
        resumeAvailable={Boolean(resume?.file_path)}
        settings={settings}
        skills={skills}
        stackProjects={allProjects}
        writing={writing}
      />
    </>
  )
}

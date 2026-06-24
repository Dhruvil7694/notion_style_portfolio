import Link from "next/link"

import { PageShell } from "@/components/public/content-shell"
import { buildPrivacySections } from "@/lib/public/privacy-content"
import { getPublicSettings } from "@/lib/public/queries"
import { buildPrivacyMetadata } from "@/lib/seo"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildPrivacyMetadata({ settings })
}

export default async function PrivacyPage() {
  const settings = await getPublicSettings()
  const sections = buildPrivacySections(settings)
  const contactEmail = settings.contact.email?.trim()

  return (
    <PageShell
      description="How this portfolio handles analytics, error monitoring, AI chat, and contact data."
      title="Privacy Policy"
    >
      <div className="space-y-8 text-sm leading-relaxed">
        {sections.map((section) => (
          <section className="space-y-3" id={section.id} key={section.id}>
            <h2 className="text-foreground text-base font-semibold tracking-tight">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p className="text-muted-foreground" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        {contactEmail ? (
          <p className="text-muted-foreground text-xs">
            Questions?{" "}
            <Link
              className="text-primary hover:underline"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </Link>
          </p>
        ) : null}
      </div>
    </PageShell>
  )
}

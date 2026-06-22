import Link from "next/link"

import { PageShell } from "@/components/public/content-shell"
import { getPublicSettings } from "@/lib/public/queries"
import { buildContactMetadata } from "@/lib/seo"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildContactMetadata({ settings })
}

export default async function ContactPage() {
  const settings = await getPublicSettings()
  const { contact, social } = settings

  return (
    <PageShell
      description="Reach out for collaborations, consulting, or engineering discussions."
      title="Contact"
    >
      <div className="space-y-6 text-sm leading-relaxed">
        {contact.email ? (
          <p>
            <span className="text-muted-foreground block text-xs tracking-wide uppercase">
              Email
            </span>
            <a
              className="text-primary hover:underline"
              href={`mailto:${contact.email}`}
            >
              {contact.email}
            </a>
          </p>
        ) : null}
        {contact.location ? (
          <p>
            <span className="text-muted-foreground block text-xs tracking-wide uppercase">
              Location
            </span>
            <span className="text-foreground">{contact.location}</span>
          </p>
        ) : null}
        {contact.calendly_url ? (
          <p>
            <span className="text-muted-foreground block text-xs tracking-wide uppercase">
              Schedule
            </span>
            <a
              className="text-primary hover:underline"
              href={contact.calendly_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Book a call
            </a>
          </p>
        ) : null}
        {social.github || social.linkedin || social.twitter || social.instagram ? (
          <div>
            <span className="text-muted-foreground mb-2 block text-xs tracking-wide uppercase">
              Social
            </span>
            <ul className="space-y-2">
              {social.github ? (
                <li>
                  <Link
                    className="text-primary hover:underline"
                    href={social.github}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    GitHub
                  </Link>
                </li>
              ) : null}
              {social.linkedin ? (
                <li>
                  <Link
                    className="text-primary hover:underline"
                    href={social.linkedin}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    LinkedIn
                  </Link>
                </li>
              ) : null}
              {social.twitter ? (
                <li>
                  <Link
                    className="text-primary hover:underline"
                    href={social.twitter}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    X
                  </Link>
                </li>
              ) : null}
              {social.instagram ? (
                <li>
                  <Link
                    className="text-primary hover:underline"
                    href={social.instagram}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Instagram
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
        {!contact.email &&
        !contact.location &&
        !contact.calendly_url &&
        !social.github &&
        !social.linkedin &&
        !social.twitter &&
        !social.instagram ? (
          <p className="text-muted-foreground">
            Contact details will appear here once configured in CMS settings.
          </p>
        ) : null}
      </div>
    </PageShell>
  )
}

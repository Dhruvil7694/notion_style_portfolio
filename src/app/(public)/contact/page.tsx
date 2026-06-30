import Link from "next/link"

import { ContactForm } from "@/features/contact/components/contact-form"
import { ContactLink } from "@/features/contact/components/contact-link"
import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { buildContactMetadata } from "@/features/seo/lib"

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
            <ContactLink
              channel="email"
              className="text-primary hover:underline"
              href={`mailto:${contact.email}`}
            >
              {contact.email}
            </ContactLink>
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
            <ContactLink
              channel="calendly"
              className="text-primary hover:underline"
              href={contact.calendly_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Book a call
            </ContactLink>
          </p>
        ) : null}
        {social.github ||
        social.linkedin ||
        social.twitter ||
        social.instagram ? (
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

      <div className="mt-8 border-t border-border/50 pt-8">
        <h2 className="mb-4 text-sm font-semibold">Send a message</h2>
        <ContactForm />
      </div>
    </PageShell>
  )
}

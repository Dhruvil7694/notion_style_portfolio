import { KbSection } from "@/components/public/kb-section"
import type { PublicSettings } from "@/lib/public/settings"

type ContactSectionProps = {
  settings: PublicSettings
  resumeAvailable: boolean
}

type ContactLine = {
  key: string
  label: string
  value: string
  href?: string
  external?: boolean
}

export function ContactSection({ settings, resumeAvailable }: ContactSectionProps) {
  const { contact, social } = settings
  const lines: ContactLine[] = []

  if (contact.email) {
    lines.push({
      key: "email",
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    })
  }

  if (social.linkedin) {
    lines.push({
      key: "linkedin",
      label: "LinkedIn",
      value: "LinkedIn",
      href: social.linkedin,
      external: true,
    })
  }

  if (social.github) {
    lines.push({
      key: "github",
      label: "GitHub",
      value: "GitHub",
      href: social.github,
      external: true,
    })
  }

  if (contact.location) {
    lines.push({
      key: "location",
      label: "Location",
      value: contact.location,
    })
  }

  if (lines.length === 0 && !resumeAvailable) {
    return null
  }

  return (
    <KbSection className="contact-section" title="Contact">
      <ul className="contact-lines">
        {lines.map((line) => (
          <li className="contact-line" key={line.key}>
            <span className="contact-line-label">{line.label}</span>
            {line.href ? (
              line.external ? (
                <a
                  className="contact-line-value"
                  href={line.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {line.value}
                </a>
              ) : (
                <a className="contact-line-value" href={line.href}>
                  {line.value}
                </a>
              )
            ) : (
              <span className="contact-line-value">{line.value}</span>
            )}
          </li>
        ))}
        {resumeAvailable ? (
          <li className="contact-line">
            <span className="contact-line-label">Resume</span>
            <a className="contact-line-value" href="/resume">
              Download
            </a>
          </li>
        ) : null}
      </ul>
    </KbSection>
  )
}

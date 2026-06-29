import Link from "next/link"

import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { getActiveSocialLinks } from "@/features/portfolio/lib/social-links"

type WorkspaceLinksProps = {
  settings: PublicSettings
  resumeAvailable: boolean
}

type DocLink = {
  key: string
  label: string
  href: string
  external?: boolean
}

export function WorkspaceLinks({
  settings,
  resumeAvailable,
}: WorkspaceLinksProps) {
  const { contact, social } = settings
  const links: DocLink[] = []

  if (resumeAvailable) {
    links.push({ key: "resume", label: "Resume", href: "/resume" })
  }

  for (const item of getActiveSocialLinks(social)) {
    links.push({
      key: item.key,
      label: item.label,
      href: item.href,
      external: true,
    })
  }

  if (contact.email) {
    links.push({
      key: "email",
      label: "Email",
      href: `mailto:${contact.email}`,
    })
  }

  if (links.length === 0) {
    return null
  }

  return (
    <ul className="workspace-links">
      {links.map((link, index) => (
        <li className="workspace-links-item" key={link.key}>
          {index > 0 ? (
            <span aria-hidden className="workspace-links-sep">
              ·
            </span>
          ) : null}
          {link.external ? (
            <a
              className="workspace-links-anchor"
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ) : link.href.startsWith("mailto:") ? (
            <a className="workspace-links-anchor" href={link.href}>
              {link.label}
            </a>
          ) : (
            <Link className="workspace-links-anchor" href={link.href}>
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

"use client"

import Link from "next/link"
import { useMemo } from "react"

import type { AboutContent } from "@/features/about/lib/about-content"
import type { PublicSettings } from "@/features/portfolio/lib/settings"
import { resolveProfileAvatarSrc } from "@/features/portfolio/lib/settings"
import type { WorkspaceContextInput } from "@/features/site-shell/lib/presence"

import { EncryptedName } from "./encrypted-name"
import { LiveClock } from "./live-clock"
import { ProfileAvatar } from "./profile-avatar"
import { WorkspaceLinks } from "./workspace-links"

type ProfileWorkspaceProps = {
  settings: PublicSettings
  resumeAvailable: boolean
}

const DEFAULT_LOCATION = "Pune, India"

function buildWorkspaceIntro(about: AboutContent): string | null {
  const parts = [about.intro?.trim(), about.intro_tools?.trim()].filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  return parts.join(" ")
}

function buildPresenceInput(settings: PublicSettings): WorkspaceContextInput {
  return {
    site: settings.site,
    contact: settings.contact,
  }
}

export function ProfileWorkspace({
  settings,
  resumeAvailable,
}: ProfileWorkspaceProps) {
  const { site, contact, about } = settings
  const name = site.owner_name || site.site_name
  const location = contact.location || DEFAULT_LOCATION
  const intro = buildWorkspaceIntro(about)
  const contextInput = useMemo(() => buildPresenceInput(settings), [settings])

  return (
    <section
      className="workspace-profile kb-section kb-section-first"
      id="profile"
    >
      <div className="workspace-profile-layout">
        <div className="workspace-identity">
          <div className="workspace-avatar-row">
            <ProfileAvatar
              avatarSrc={resolveProfileAvatarSrc(site)}
              contextInput={contextInput}
              name={name}
            />
            <LiveClock
              className="workspace-clock workspace-clock-mobile md:hidden"
              location={location}
            />
          </div>

          <div className="workspace-name-row">
            <EncryptedName contextInput={contextInput} name={name} />
            <LiveClock
              className="workspace-clock hidden md:block"
              location={location}
            />
          </div>

          {site.owner_title ? (
            <p className="workspace-role">{site.owner_title}</p>
          ) : null}

          {intro ? (
            <p className="workspace-intro">
              {intro}
              {"… "}
              <Link className="workspace-intro-more" href="/about">
                more about me
              </Link>
            </p>
          ) : null}

          <WorkspaceLinks
            resumeAvailable={resumeAvailable}
            settings={settings}
          />
        </div>
      </div>
    </section>
  )
}

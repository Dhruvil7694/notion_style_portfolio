import type { SocialLinks } from "@/features/portfolio/lib/settings"

export type SocialLinkKey =
  | "github"
  | "linkedin"
  | "twitter"
  | "substack"
  | "medium"
  | "discord"
  | "instagram"
  | "youtube"
  | "bluesky"
  | "threads"
  | "devto"

export type SocialLinkDefinition = {
  key: SocialLinkKey
  label: string
  href: string
}

const SOCIAL_LINK_ORDER: SocialLinkKey[] = [
  "github",
  "linkedin",
  "twitter",
  "substack",
  "medium",
  "discord",
  "youtube",
  "bluesky",
  "threads",
  "devto",
  "instagram",
]

const SOCIAL_LABELS: Record<SocialLinkKey, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  twitter: "X",
  substack: "Substack",
  medium: "Medium",
  discord: "Discord",
  instagram: "Instagram",
  youtube: "YouTube",
  bluesky: "Bluesky",
  threads: "Threads",
  devto: "Dev.to",
}

export function getActiveSocialLinks(
  social: SocialLinks
): SocialLinkDefinition[] {
  return SOCIAL_LINK_ORDER.flatMap((key) => {
    const href = social[key]?.trim()
    if (!href) {
      return []
    }

    return [{ key, label: SOCIAL_LABELS[key], href }]
  })
}

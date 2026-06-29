import { z } from "zod"

import {
  type AboutContent,
  aboutContentSchema,
  DEFAULT_ABOUT_CONTENT,
} from "@/features/about/lib/about-content"
import { PORTRAIT_IMAGES } from "@/features/site-shell/lib/portrait/portrait-assets"

export const DEFAULT_STATUS_MESSAGES = [
  "Building production AI systems",
  "Researching multi-agent systems",
  "Working on enterprise RAG",
  "Writing AI notes",
] as const

export const DEFAULT_FOCUS_AREAS = [
  "Multi-Agent Systems",
  "RAG",
  "AI Automation",
  "LLM Infrastructure",
  "Applied Research",
] as const

export const DEFAULT_SELECTED_METRICS = [
  "4+ Production Systems",
  "10+ AI Projects",
  "3 Research Initiatives",
  "5+ Years Building Software",
] as const

export const siteSettingsSchema = z.object({
  site_name: z.string().default("Portfolio"),
  site_description: z.string().default(""),
  owner_name: z.string().default(""),
  owner_title: z.string().default(""),
  owner_avatar: z.string().optional().nullable(),
  owner_avatar_about: z.string().optional().nullable(),
  owner_avatar_original: z.string().optional().nullable(),
  status_bubble: z.string().optional().nullable(),
  status_messages: z.array(z.string()).default([...DEFAULT_STATUS_MESSAGES]),
  currently_building: z.string().optional().nullable(),
  currently_reading: z.string().optional().nullable(),
  next_project: z.string().optional().nullable(),
  current_project: z.string().optional().nullable(),
  custom_status: z.string().optional().nullable(),
  status_enabled: z.boolean().default(true),
  focus_areas: z.array(z.string()).default([...DEFAULT_FOCUS_AREAS]),
  selected_metrics: z.array(z.string()).default([...DEFAULT_SELECTED_METRICS]),
  experience_summary: z.string().optional().nullable(),
  bio_secondary: z.string().optional().nullable(),
  site_url: z.string().optional(),
})

export const socialLinksSchema = z.object({
  github: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  substack: z.string().optional().nullable(),
  medium: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  bluesky: z.string().optional().nullable(),
  threads: z.string().optional().nullable(),
  devto: z.string().optional().nullable(),
})

export const contactInfoSchema = z.object({
  email: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  calendly_url: z.string().optional().nullable(),
})

export type SiteSettings = z.infer<typeof siteSettingsSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>
export type ContactInfo = z.infer<typeof contactInfoSchema>

export type PublicSettings = {
  site: SiteSettings
  social: SocialLinks
  contact: ContactInfo
  about: AboutContent
}

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  site: siteSettingsSchema.parse({}),
  social: {},
  contact: {},
  about: DEFAULT_ABOUT_CONTENT,
}

export function parsePublicSettings(
  rows: { key: string; value: unknown }[]
): PublicSettings {
  const byKey = Object.fromEntries(rows.map((row) => [row.key, row.value]))

  return {
    site: siteSettingsSchema.parse(byKey.site_settings ?? {}),
    social: socialLinksSchema.parse(byKey.social_links ?? {}),
    contact: contactInfoSchema.parse(byKey.contact_info ?? {}),
    about: aboutContentSchema.parse(byKey.about_content ?? {}),
  }
}

export const DEFAULT_PROFILE_AVATAR = PORTRAIT_IMAGES.straight

export function resolveOwnerAvatar(site: SiteSettings): string | null {
  const cmsAvatar =
    site.owner_avatar?.trim() ||
    site.owner_avatar_about?.trim() ||
    site.owner_avatar_original?.trim()

  return cmsAvatar || null
}

export function resolveProfileAvatarSrc(
  site: SiteSettings
): typeof PORTRAIT_IMAGES.straight | string {
  return resolveOwnerAvatar(site) ?? DEFAULT_PROFILE_AVATAR
}

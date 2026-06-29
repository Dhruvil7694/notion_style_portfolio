import { z } from "zod"

import {
  aboutContentSchema,
  DEFAULT_ABOUT_CONTENT,
} from "@/features/about/lib/about-content"
import {
  commaListToText,
  optionalUrlSchema,
  parseCommaList,
} from "@/features/admin/lib/schemas/common"
import {
  contactInfoSchema,
  siteSettingsSchema,
  socialLinksSchema,
} from "@/features/portfolio/lib/settings"

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))

const optionalEmailSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.union([z.string().email("Enter a valid email"), z.null()]))

const avatarUrlFormSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .pipe(z.union([z.string().url("Enter a valid image URL"), z.null()]))

export const profileFormSchema = z.object({
  site_name: z.string().trim().min(1, "Site name is required"),
  owner_name: z.string().trim().min(1, "Name is required"),
  owner_title: z.string().trim().min(1, "Title is required"),
  owner_avatar: avatarUrlFormSchema,
  site_description: z.string(),
  status_bubble: z.string(),
  status_messages: z.string().transform(parseCommaList),
  currently_building: optionalTextSchema,
  currently_reading: optionalTextSchema,
  next_project: optionalTextSchema,
  current_project: optionalTextSchema,
  custom_status: optionalTextSchema,
  status_enabled: z.boolean(),
  focus_areas: z.string().transform(parseCommaList),
  selected_metrics: z.string().transform(parseCommaList),
  experience_summary: z.string(),
})

export const aboutPageFormSchema = z.object({
  owner_avatar_about: avatarUrlFormSchema,
  intro: z.string(),
  intro_tools: z.string(),
  career_intro: z.string(),
  after_umbrella: z.string(),
  retrieval: z.string(),
  ownership: z.string(),
  outside: z.string(),
  mcp: z.string(),
  tags: z
    .string()
    .transform(parseCommaList)
    .pipe(z.array(z.string()).min(1, "Add at least one tag")),
  flip_keywords: z.string().transform(parseCommaList),
})

export const socialLinksFormSchema = socialLinksSchema.extend({
  github: optionalUrlSchema,
  linkedin: optionalUrlSchema,
  twitter: optionalUrlSchema,
  instagram: optionalUrlSchema,
  substack: optionalUrlSchema,
  medium: optionalUrlSchema,
  discord: optionalUrlSchema,
  youtube: optionalUrlSchema,
  bluesky: optionalUrlSchema,
  threads: optionalUrlSchema,
  devto: optionalUrlSchema,
})

export const contactInfoFormSchema = contactInfoSchema.extend({
  email: optionalEmailSchema,
  location: optionalTextSchema,
  calendly_url: optionalUrlSchema,
})

export const settingsFormSchema = z.object({
  social: socialLinksFormSchema,
  contact: contactInfoFormSchema,
  site_url: optionalUrlSchema,
})

const nullableStringSchema = z.union([z.string(), z.null()]).optional()

const nullableUrlSchema = z
  .union([z.string().url("Enter a valid URL"), z.null()])
  .optional()

const nullableEmailSchema = z
  .union([z.string().email("Enter a valid email"), z.null()])
  .optional()

export const profilePersistSchema = z.object({
  site_name: z.string().trim().min(1, "Site name is required"),
  owner_name: z.string().trim().min(1, "Name is required"),
  owner_title: z.string().trim().min(1, "Title is required"),
  owner_avatar: nullableUrlSchema,
  site_description: z.string(),
  status_bubble: nullableStringSchema,
  status_messages: z.array(z.string()).optional(),
  currently_building: nullableStringSchema,
  currently_reading: nullableStringSchema,
  next_project: nullableStringSchema,
  current_project: nullableStringSchema,
  custom_status: nullableStringSchema,
  status_enabled: z.boolean().optional(),
  focus_areas: z.array(z.string()).optional(),
  selected_metrics: z.array(z.string()).optional(),
  experience_summary: nullableStringSchema,
})

export const settingsPersistSchema = z.object({
  social: z.object({
    github: nullableUrlSchema,
    linkedin: nullableUrlSchema,
    twitter: nullableUrlSchema,
    instagram: nullableUrlSchema,
    substack: nullableUrlSchema,
    medium: nullableUrlSchema,
    discord: nullableUrlSchema,
    youtube: nullableUrlSchema,
    bluesky: nullableUrlSchema,
    threads: nullableUrlSchema,
    devto: nullableUrlSchema,
  }),
  contact: z.object({
    email: nullableEmailSchema,
    location: nullableStringSchema,
    calendly_url: nullableUrlSchema,
  }),
  site_url: nullableUrlSchema,
})

export type ProfileFormValues = z.input<typeof profileFormSchema>
export type ProfileFormData = z.output<typeof profileFormSchema>
export type AboutPageFormValues = z.input<typeof aboutPageFormSchema>
export type AboutPageFormData = z.output<typeof aboutPageFormSchema>
export type SocialLinksFormValues = z.input<typeof socialLinksFormSchema>
export type ContactInfoFormValues = z.input<typeof contactInfoFormSchema>
export type SettingsFormValues = z.input<typeof settingsFormSchema>
export type SettingsFormData = z.output<typeof settingsFormSchema>

export function toProfileFormValues(
  site: z.infer<typeof siteSettingsSchema>
): ProfileFormValues {
  return {
    site_name: site.site_name ?? "",
    owner_name: site.owner_name ?? "",
    owner_title: site.owner_title ?? "",
    owner_avatar: site.owner_avatar ?? "",
    site_description: site.site_description ?? "",
    status_bubble: site.status_bubble ?? "",
    status_messages: commaListToText(site.status_messages),
    currently_building: site.currently_building ?? "",
    currently_reading: site.currently_reading ?? "",
    next_project: site.next_project ?? "",
    current_project: site.current_project ?? "",
    custom_status: site.custom_status ?? site.status_bubble ?? "",
    status_enabled: site.status_enabled ?? true,
    focus_areas: commaListToText(site.focus_areas),
    selected_metrics: commaListToText(site.selected_metrics),
    experience_summary: site.experience_summary ?? "",
  }
}

export function toAboutFormValues(settings: {
  site: z.infer<typeof siteSettingsSchema>
  about: z.infer<typeof aboutContentSchema>
}): AboutPageFormValues {
  return {
    owner_avatar_about:
      settings.site.owner_avatar_about ??
      settings.site.owner_avatar_original ??
      "",
    intro: settings.about.intro ?? DEFAULT_ABOUT_CONTENT.intro,
    intro_tools:
      settings.about.intro_tools ?? DEFAULT_ABOUT_CONTENT.intro_tools,
    career_intro:
      settings.about.career_intro ?? DEFAULT_ABOUT_CONTENT.career_intro,
    after_umbrella:
      settings.about.after_umbrella ?? DEFAULT_ABOUT_CONTENT.after_umbrella,
    retrieval: settings.about.retrieval ?? DEFAULT_ABOUT_CONTENT.retrieval,
    ownership: settings.about.ownership ?? DEFAULT_ABOUT_CONTENT.ownership,
    outside: settings.about.outside ?? DEFAULT_ABOUT_CONTENT.outside,
    mcp: settings.about.mcp ?? DEFAULT_ABOUT_CONTENT.mcp,
    tags: commaListToText(settings.about.tags),
    flip_keywords: commaListToText(settings.about.flip_keywords),
  }
}

export function toSettingsFormValues(settings: {
  site: z.infer<typeof siteSettingsSchema>
  social: z.infer<typeof socialLinksSchema>
  contact: z.infer<typeof contactInfoSchema>
}): SettingsFormValues {
  return {
    social: {
      github: settings.social.github ?? "",
      linkedin: settings.social.linkedin ?? "",
      twitter: settings.social.twitter ?? "",
      instagram: settings.social.instagram ?? "",
      substack: settings.social.substack ?? "",
      medium: settings.social.medium ?? "",
      discord: settings.social.discord ?? "",
      youtube: settings.social.youtube ?? "",
      bluesky: settings.social.bluesky ?? "",
      threads: settings.social.threads ?? "",
      devto: settings.social.devto ?? "",
    },
    contact: {
      email: settings.contact.email ?? "",
      location: settings.contact.location ?? "",
      calendly_url: settings.contact.calendly_url ?? "",
    },
    site_url: settings.site.site_url ?? "",
  }
}

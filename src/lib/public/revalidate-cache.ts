import "server-only"

import { revalidatePath, revalidateTag } from "next/cache"

import type { Content } from "@/types/database.helpers"

import {
  contentCacheTag,
  projectCacheTag,
  PUBLIC_CACHE_TAGS,
} from "./cache-tags"

export function revalidatePublicSettings() {
  revalidateTag(PUBLIC_CACHE_TAGS.settings)
  revalidateSeoRoutes()
}

/** Sitemap, robots, and llms.txt read site_url from CMS — refresh when settings change. */
export function revalidateSeoRoutes() {
  revalidatePath("/sitemap.xml")
  revalidatePath("/robots.txt")
  revalidatePath("/llms.txt")
}

export function revalidatePublicResume() {
  revalidateTag(PUBLIC_CACHE_TAGS.resume)
}

export function revalidatePublicProjects(slug?: string) {
  revalidateTag(PUBLIC_CACHE_TAGS.projects)
  if (slug) {
    revalidateTag(projectCacheTag(slug))
  }
}

export function revalidatePublicExperience() {
  revalidateTag(PUBLIC_CACHE_TAGS.experience)
}

export function revalidatePublicSkills() {
  revalidateTag(PUBLIC_CACHE_TAGS.skills)
}

export function revalidatePublicEducation() {
  revalidateTag(PUBLIC_CACHE_TAGS.education)
}

export function revalidatePublicContent(type?: Content["type"]) {
  revalidateTag(PUBLIC_CACHE_TAGS.content)
  if (type) {
    revalidateTag(contentCacheTag(type))
  }
}

export function revalidatePublicExpertise() {
  revalidateTag(PUBLIC_CACHE_TAGS.expertise)
}

export function revalidatePublicTechnology() {
  revalidateTag(PUBLIC_CACHE_TAGS.technology)
}

export function revalidatePublicConcept() {
  revalidateTag(PUBLIC_CACHE_TAGS.concept)
}

export function revalidateKnowledgeGraph() {
  revalidateTag(PUBLIC_CACHE_TAGS.knowledgeGraph)
}

export function revalidateDiscoveryIndex() {
  revalidateTag(PUBLIC_CACHE_TAGS.discovery)
}

export function revalidateKnowledgeAndDiscovery() {
  revalidateKnowledgeGraph()
  revalidateDiscoveryIndex()
}

/** Invalidate layout-level public reads (settings + resume). */
export function revalidatePublicLayoutData() {
  revalidatePublicSettings()
  revalidatePublicResume()
}

/** Broad invalidation after mutations that affect multiple public surfaces. */
export function revalidatePublicSiteData() {
  revalidatePublicLayoutData()
  revalidatePublicProjects()
  revalidatePublicExperience()
  revalidatePublicSkills()
  revalidatePublicEducation()
  revalidatePublicContent()
  revalidatePublicExpertise()
  revalidatePublicTechnology()
  revalidatePublicConcept()
  revalidateKnowledgeAndDiscovery()
}

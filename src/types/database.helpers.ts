/**
 * Convenience type aliases derived from generated database.ts.
 * Safe to keep across `supabase gen types` — do not edit database.ts manually.
 */
import type { Database, Enums, Tables } from "./database"

export type { Database, Enums, Json, Tables } from "./database"

export type Project = Tables<"projects">
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]

export type Content = Tables<"content">
export type ContentInsert = Database["public"]["Tables"]["content"]["Insert"]
export type ContentUpdate = Database["public"]["Tables"]["content"]["Update"]

export type Experience = Tables<"experience">
export type Skill = Tables<"skills">
export type ExpertiseArea = Tables<"expertise_areas">
export type TechnologyRegistry = Tables<"technology_registry">
export type ConceptRegistry = Tables<"concept_registry">
export type Education = Tables<"education">
export type Setting = Tables<"settings">
export type Resume = Tables<"resumes">
export type ContactSubmission = Tables<"contact_submissions">

export type ContentStatus = Enums<"content_status">
export type ContentType = Enums<"content_type">
export type SkillCategory = Enums<"skill_category">
export type SkillProficiency = Enums<"skill_proficiency">

/** Alias to distinguish DB enum from content.ts ContentStatus when both are needed */
export type DbContentStatus = ContentStatus

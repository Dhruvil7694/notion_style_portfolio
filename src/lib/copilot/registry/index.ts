import "server-only"

import { aboutRegistry } from "./about"
import { clarificationRegistry } from "./clarification"
import { contentRegistry } from "./content"
import { educationRegistry } from "./education"
import { experienceRegistry } from "./experience"
import { knowledgeGraphRegistry } from "./knowledge-graph"
import { profileRegistry } from "./profile"
import { projectsRegistry } from "./projects"
import { skillsRegistry } from "./skills"
import type {
  CopilotApplyTool,
  CopilotProposeTool,
  CopilotReadTool,
  CopilotRegistry,
} from "./types"

let cached: CopilotRegistry | null = null

export function getCopilotRegistry(): CopilotRegistry {
  if (cached) return cached
  cached = {
    read: {
      ...aboutRegistry.read,
      ...skillsRegistry.read,
      ...projectsRegistry.read,
      ...experienceRegistry.read,
      ...educationRegistry.read,
      ...contentRegistry.read,
      ...profileRegistry.read,
      ...knowledgeGraphRegistry.read,
    },
    propose: {
      ...aboutRegistry.propose,
      ...skillsRegistry.propose,
      ...projectsRegistry.propose,
      ...experienceRegistry.propose,
      ...educationRegistry.propose,
      ...contentRegistry.propose,
      ...profileRegistry.propose,
      ...knowledgeGraphRegistry.propose,
      ...clarificationRegistry.propose,
    },
    apply: {
      ...aboutRegistry.apply,
      ...skillsRegistry.apply,
      ...projectsRegistry.apply,
      ...experienceRegistry.apply,
      ...educationRegistry.apply,
      ...contentRegistry.apply,
      ...profileRegistry.apply,
      ...knowledgeGraphRegistry.apply,
    },
  }
  return cached
}

export function getApplyTool(name: string): CopilotApplyTool | undefined {
  return getCopilotRegistry().apply[name]
}

export function getProposeTool(name: string): CopilotProposeTool | undefined {
  return getCopilotRegistry().propose[name]
}

export function getReadTool(name: string): CopilotReadTool | undefined {
  return getCopilotRegistry().read[name]
}

export type { CopilotRegistry } from "./types"

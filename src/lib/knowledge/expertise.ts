export * from "./graph"

import type { KnowledgeGraphPayload } from "./types"

export type ExpertiseBundle = ReturnType<
  typeof import("./graph").getExpertiseBundle
>

export type TechnologyBundle = ReturnType<
  typeof import("./graph").getTechnologyBundle
>

export type { KnowledgeGraphPayload }

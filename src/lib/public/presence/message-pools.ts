import type { ContextMessage, PresenceChannel, WorkspaceContext, WorkspaceState } from "./types"

function msg(text: string, weight = 1): ContextMessage {
  return { text, weight }
}

function weighted(items: Array<[string, number]>): ContextMessage[] {
  return items.map(([text, weight]) => msg(text, weight))
}

export function buildProjectMessages(project: string): ContextMessage[] {
  return weighted([
    [`Currently building ${project}`, 3],
    [`Improving ${project} retrieval`, 2],
    [`Working on ${project} agents`, 2],
    [`Scaling ${project} workflows`, 2],
    [`Researching improvements for ${project}`, 1],
    [`Hardening ${project} for production`, 2],
  ])
}

export function buildBuildingMessages(building: string): ContextMessage[] {
  return weighted([
    [`Building ${building}`, 3],
    [`Designing ${building} workflows`, 2],
    [`Shipping ${building} features`, 2],
    [`Working on ${building} infrastructure`, 2],
    [`Integrating ${building} into production`, 1],
  ])
}

export function buildReadingMessages(reading: string): ContextMessage[] {
  const short = reading.length > 42 ? `${reading.slice(0, 39)}…` : reading

  return weighted([
    [`Reading ${short}`, 3],
    [`Studying ${short}`, 2],
    [`Learning from ${short}`, 2],
    [`Deep in ${short}`, 1],
    [`Taking notes on ${short}`, 1],
  ])
}

const WEEKEND_SATURDAY: ContextMessage[] = weighted([
  ["Weekend mode", 2],
  ["Side projects today", 2],
  ["Exploring something new", 2],
  ["Learning without deadlines", 1],
  ["Weekend builder energy", 2],
  ["Experimenting with new agents", 1],
])

const WEEKEND_SUNDAY: ContextMessage[] = weighted([
  ["Happy Sunday", 3],
  ["Sunday reset", 2],
  ["Planning the week", 2],
  ["Reading and reflecting", 2],
  ["Recharging for Monday", 2],
  ["Back at it soon", 1],
  ["Reviewing the week ahead", 1],
])

const SLEEPING: ContextMessage[] = weighted([
  ["Offline — resting", 2],
  ["Sleep mode", 2],
  ["Back tomorrow", 2],
  ["Recharging for deep work", 1],
])

export const STATE_MESSAGE_POOLS: Record<WorkspaceState, ContextMessage[]> = {
  sleeping: SLEEPING,
  planning: weighted([
    ["Planning the day's builds", 2],
    ["Reviewing agent architecture", 2],
    ["Prioritizing production work", 2],
    ["Mapping retrieval improvements", 1],
    ["Setting up evaluation runs", 1],
  ]),
  deep_work: weighted([
    ["Deep work on AI systems", 3],
    ["Building production AI systems", 3],
    ["In a focus block", 2],
    ["Designing agent workflows", 2],
    ["Improving document intelligence", 2],
  ]),
  building: weighted([
    ["Building production AI systems", 3],
    ["Designing enterprise AI workflows", 2],
    ["Working on evaluation systems", 2],
    ["Making AI systems production-ready", 2],
    ["Building enterprise AI workflows", 2],
  ]),
  researching: weighted([
    ["Researching multi-agent systems", 3],
    ["Evaluating retrieval quality", 3],
    ["Improving RAG precision", 2],
    ["Testing memory architectures", 2],
    ["Running another benchmark", 1],
  ]),
  debugging: weighted([
    ["Debugging an embedding pipeline", 3],
    ["Reducing hallucinations", 2],
    ["Tracing agent failures", 2],
    ["Fixing retrieval edge cases", 2],
  ]),
  learning: weighted([
    ["Learning new agent patterns", 2],
    ["Studying system design", 2],
    ["Reading technical papers", 2],
    ["Exploring MCP integrations", 1],
    ["Optimizing context windows", 2],
  ]),
  shipping: weighted([
    ["Still shipping", 3],
    ["Shipping production features", 2],
    ["Deploying AI workflows", 2],
    ["Teaching agents new tricks", 1],
    ["Closing out the day's work", 1],
  ]),
  weekend: WEEKEND_SATURDAY,
  offline: weighted([
    ["Offline for now", 2],
    ["Away from the desk", 1],
    ["Back soon", 1],
  ]),
}

const TIMEBLOCK_POOLS: Partial<Record<WorkspaceState, ContextMessage[]>> = {
  sleeping: weighted([["Rest mode", 2], ["Offline tonight", 1]]),
  planning: weighted([["Planning mode", 2], ["Setting priorities", 1]]),
  deep_work: weighted([["Deep work block", 3], ["In the zone", 2]]),
  researching: weighted([["Research session", 2], ["Evaluating systems", 2]]),
  building: weighted([["Build session", 2], ["In production mode", 2]]),
  shipping: weighted([["Still shipping", 3], ["Evening deploy window", 2]]),
  learning: weighted([["Learning block", 2], ["Reading tonight", 1]]),
  weekend: weighted([["Weekend pace", 2], ["Off the clock", 1]]),
}

const NAME_POOLS: Partial<Record<WorkspaceState, ContextMessage[]>> = {
  sleeping: weighted([["Probably sleeping", 1], ["Offline for the night", 1]]),
  planning: weighted([["Planning the week", 2], ["Coffee first, then code", 1]]),
  deep_work: weighted([
    ["Building production AI systems", 3],
    ["Deep in the codebase", 2],
    ["Designing agent workflows", 2],
  ]),
  researching: weighted([
    ["Researching RAG architectures", 2],
    ["Evaluating retrieval quality", 2],
  ]),
  building: weighted([
    ["Building something useful", 2],
    ["Making AI production-ready", 2],
  ]),
  shipping: weighted([["Still shipping", 3], ["Evening deploy window", 2]]),
  learning: weighted([["Learning something new", 1], ["Reading tonight", 1]]),
  weekend: weighted([
    ["Happy weekend", 2],
    ["Weekend mode", 2],
    ["Enjoying the weekend", 1],
  ]),
}

export function resolveMessagePool(
  context: WorkspaceContext,
  channel: PresenceChannel
): ContextMessage[] {
  if (context.statusEnabled && context.customStatus) {
    return [msg(context.customStatus, 1)]
  }

  if (isWeekendPool(context)) {
    return context.day === 0 ? WEEKEND_SUNDAY : WEEKEND_SATURDAY
  }

  if (isSleepingPool(context)) {
    return SLEEPING
  }

  if (context.currentProject) {
    return buildProjectMessages(context.currentProject)
  }

  if (context.currentlyBuilding) {
    return buildBuildingMessages(context.currentlyBuilding)
  }

  if (context.currentlyReading) {
    return buildReadingMessages(context.currentlyReading)
  }

  const state = resolvePoolState(context)

  if (channel === "timeblock") {
    return TIMEBLOCK_POOLS[state] ?? STATE_MESSAGE_POOLS[state]
  }

  if (channel === "name") {
    return NAME_POOLS[state] ?? STATE_MESSAGE_POOLS[state]
  }

  return STATE_MESSAGE_POOLS[state]
}

function isWeekendPool(context: WorkspaceContext): boolean {
  return context.day === 0 || context.day === 6
}

function isSleepingPool(context: WorkspaceContext): boolean {
  return context.hour >= 0 && context.hour < 6
}

function resolvePoolState(context: WorkspaceContext): WorkspaceState {
  if (context.hour >= 0 && context.hour < 6) return "sleeping"
  if (context.hour >= 6 && context.hour < 9) return "planning"
  if (context.hour >= 9 && context.hour < 12) return "deep_work"
  if (context.hour >= 12 && context.hour < 14) return "researching"
  if (context.hour >= 14 && context.hour < 18) return "building"
  if (context.hour >= 18 && context.hour < 22) return "shipping"
  return "learning"
}

export function getPresenceMessagePool(
  context: WorkspaceContext,
  channel: PresenceChannel = "bubble"
): ContextMessage[] {
  return resolveMessagePool(context, channel)
}

function uniqueMessages(messages: ContextMessage[]): ContextMessage[] {
  const seen = new Set<string>()
  const result: ContextMessage[] = []

  for (const message of messages) {
    if (!seen.has(message.text)) {
      seen.add(message.text)
      result.push(message)
    }
  }

  return result
}

export function getAvatarHoverMessagePool(context: WorkspaceContext): ContextMessage[] {
  const messages: ContextMessage[] = []

  if (context.statusEnabled && context.customStatus) {
    messages.push(msg(context.customStatus, 1))
  }

  if (context.currentProject) {
    messages.push(...buildProjectMessages(context.currentProject))
  }

  if (context.currentlyBuilding) {
    messages.push(...buildBuildingMessages(context.currentlyBuilding))
  }

  if (context.currentlyReading) {
    messages.push(...buildReadingMessages(context.currentlyReading))
  }

  if (context.nextFocus) {
    messages.push(msg(`Next focus: ${context.nextFocus}`, 1))
  }

  messages.push(
    ...resolveMessagePool(
      {
        ...context,
        statusEnabled: false,
        customStatus: undefined,
        currentProject: undefined,
        currentlyBuilding: undefined,
        currentlyReading: undefined,
        nextFocus: undefined,
      },
      "bubble"
    )
  )

  return uniqueMessages(messages)
}

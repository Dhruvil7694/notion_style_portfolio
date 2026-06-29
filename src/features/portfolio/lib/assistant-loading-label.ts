type QuestionIntent =
  | "compare"
  | "list"
  | "how"
  | "why"
  | "explain"
  | "what"
  | "general"

function detectIntent(question: string): QuestionIntent {
  const lower = question.toLowerCase().trim()
  if (/\b(compare|versus|vs\.?|difference between)\b/.test(lower))
    return "compare"
  if (/^(list|show me all|what are (all )?the|which )\b/.test(lower))
    return "list"
  if (/^how\b/.test(lower)) return "how"
  if (/^why\b/.test(lower)) return "why"
  if (
    /^(explain|describe|tell me|give me|walk me through|overview of)\b/.test(
      lower
    )
  ) {
    return "explain"
  }
  if (/^what\b/.test(lower)) return "what"
  return "general"
}

function formatTopicWords(topic: string): string {
  return topic
    .split(/\s+/)
    .map((word) => {
      if (/^[A-Z]{2,}[\d+]?$/.test(word)) return word
      if (/^[A-Z][a-z]+[A-Z]/.test(word)) return word
      if (word.length <= 2) return word.toLowerCase()
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
}

function extractTopic(question: string): string {
  let topic = question.trim().replace(/\?+$/, "")

  topic = topic.replace(
    /^(can you |could you |please |would you |i('|')d like to know |i want to know )/i,
    ""
  )

  topic = topic.replace(
    /^(explain|describe|tell me about|tell me|give me an overview of|give me a overview of|give me|show me|walk me through|list|compare|what are all the|what are the|what are|what is the|what is|what's the|what's|what|how do you|how does|how can|how would|how are|how is|why do you|why does|why is|why are|who is|who are|when did|when does|where did|where does|which )\s*/i,
    ""
  )

  topic = topic.replace(
    /^(handle|approach|use|implement|build|manage|work with)\s+/i,
    ""
  )

  topic = topic.replace(
    /\b(dhruvil'?s?|your|you|his|their|on (this |your )?portfolio|in (this |your )?portfolio|on (this |the )?site)\b/gi,
    " "
  )

  topic = topic.replace(
    /\s+(have you|has (he|dhruvil)|do you|did you|are you|were you)\s+(worked on|built|done|used|implemented|worked with|experience with).*$/i,
    ""
  )

  topic = topic.replace(
    /\b(in your experience|about your work|on this portfolio|please|thanks?)\.?$/i,
    ""
  )

  topic = topic.replace(/\s+/g, " ").trim()
  topic = topic.replace(/^(the|a|an)\s+/i, "")

  if (topic.length > 42) {
    const clause = topic.split(/[,;]|\s+and\s+/)[0]?.trim()
    if (clause && clause.length >= 6) topic = clause
  }

  if (topic.length > 42) topic = `${topic.slice(0, 39).trim()}…`

  return formatTopicWords(topic)
}

export function formatAssistantLoadingLabel(question: string): string {
  const raw = question.trim()
  if (!raw) return "Searching portfolio…"
  if (/Analyse my job fit for this role:/i.test(raw))
    return "Analysing job fit…"

  const intent = detectIntent(raw)
  const topic = extractTopic(raw)

  if (!topic || topic.length < 3) return "Searching portfolio…"

  switch (intent) {
    case "explain":
      return `Looking up ${topic}…`
    case "what":
    case "list":
      return `Searching ${topic}…`
    case "how":
      return `Looking into ${topic}…`
    case "why":
      return `Exploring ${topic}…`
    case "compare":
      return `Comparing ${topic}…`
    default:
      return `Searching ${topic}…`
  }
}

#!/usr/bin/env node
/**
 * Insert the WhatsApp AI Lead Qualifier project.
 * Usage: node scripts/insert-whatsapp-lead-qualifier.mjs
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return null
  const separatorIndex = trimmed.indexOf("=")
  if (separatorIndex <= 0) return null
  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  return { key, value }
}

function loadEnv() {
  const values = {}
  for (const name of [".env.local", ".env"]) {
    const envPath = resolve(process.cwd(), name)
    if (!existsSync(envPath)) continue
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const parsed = parseEnvLine(line)
      if (parsed) values[parsed.key] = parsed.value
    }
  }
  return values
}

function splitParagraphs(text) {
  return text
    .split(/\n\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitCommaList(text) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function emptyToNull(items) {
  return items.length > 0 ? items : null
}

const SLUG = "whatsapp-real-estate-lead-qualifier"

const project = {
  title: "WhatsApp AI Lead Qualifier for Real Estate — Surat",
  slug: SLUG,
  summary:
    "Production n8n + GPT-4o system that instantly qualifies 60–70 daily WhatsApp property leads for Surat brokers: hybrid AI chat, inventory shortlists, lead scoring, site-visit booking, and a multi-tenant Next.js ops dashboard. Deployed to 12 clients in one month.",
  tagline:
    "Instant first-touch on WhatsApp when 90% of property leads were going dead",
  status: "published",
  icon_name: "lucide:message-circle",
  cover_image: null,
  thumbnail: null,
  architecture_image: null,
  demo_video_url: null,
  year: "2026",
  category: "Enterprise AI",
  role: "Solo Builder — Applied AI Engineer",
  tech_stack: splitCommaList(
    "n8n, GPT-4o, Meta WhatsApp Cloud API, PostgreSQL, Next.js, Prisma, NextAuth, Google Calendar, Docker, ngrok, Node.js, TypeScript"
  ),
  tech_stack_groups: [
    {
      category: "AI / Orchestration",
      items: ["GPT-4o", "n8n", "Custom prompt routing", "Lead scoring engine"],
    },
    {
      category: "Backend & Data",
      items: [
        "PostgreSQL",
        "Prisma",
        "Session state machine",
        "Property inventory schema",
      ],
    },
    {
      category: "Frontend & Ops",
      items: [
        "Next.js",
        "NextAuth",
        "Multi-broker dashboard",
        "Human takeover UI",
      ],
    },
    {
      category: "Infrastructure",
      items: [
        "Meta WhatsApp Cloud API",
        "Docker",
        "ngrok",
        "Google Calendar API",
      ],
    },
  ],
  project_url: null,
  github_url: null,
  live_url: null,
  challenge:
    "Surat brokers get 60–70 WhatsApp leads/day but ~90% go unanswered. Each lead costs ₹5k–₹50k to acquire. HBR research shows responding in 30 min vs 5 min cuts conversion odds by 21×—yet Indian teams often reply hours later.",
  solution:
    "I built a hybrid n8n + GPT-4o qualifier: sub-minute replies, structured profiling via AI + WhatsApp buttons, inventory-backed shortlists, hot-lead scoring, broker alerts, site-visit booking, and a broker dashboard with human takeover.",
  impact:
    "12 Surat brokers live in one month. Every inbound lead gets instant first touch; qualified profiles and site visits appear in the dashboard so small teams focus on closing, not screening.",
  overview:
    "A Surat operator messaged me: 60–70 WhatsApp leads daily, ~90% unreplied—the team was too small. At ₹5k–₹50k per lead, unreplied volume was burning lakhs in ad value daily.\n\nI shipped n8n + Meta WhatsApp Cloud API + GPT-4o qualification with hybrid routing, PostgreSQL sessions, and a Next.js multi-broker dashboard. Twelve Surat brokers went live within one month.",
  problem:
    'The problem started with a direct message from a Surat real estate operator: roughly 60 to 70 inbound WhatsApp leads every single day, and nearly 90% never received a reply because the business did not have enough sales staff to respond fast enough.\n\nThat is not a minor operational gap—it is a capital destruction problem. Public industry estimates in Indian real estate put the cost of acquiring a single qualified lead anywhere between ₹5,000 and ₹50,000 depending on channel, city, and project tier. Even at the conservative end, 60 unreplied leads per day represents ₹3 lakh or more in wasted acquisition value daily. At scale, that is the advertising budget working against the business instead of for it.\n\nThe urgency gap is well documented. In the Lead Response Management study published through Harvard Business Review (Oldroyd, McFarland, Elkington, 2011), firms that contacted web leads within five minutes were 21 times more likely to qualify the lead than firms that waited thirty minutes. MIT Sloan and related sales-operations research on online lead behavior reinforce the same pattern: speed-to-lead is one of the highest-leverage variables in conversion, and delay compounds quickly.\n\nIn Surat\'s WhatsApp-first market, the reality is worse than the thirty-minute benchmark. Buyers message multiple brokers at once. If one broker replies in seconds with relevant options and another replies two hours later with "Sir please share budget," the slow broker has already lost the conversation before a human ever joins.\n\nThe operator who contacted me was not an edge case. Small and mid-size brokerages across Gujarat run Meta and portal campaigns, collect high-intent WhatsApp traffic, and then choke on manual triage: greeting, budget, area, timeline, purpose, matching inventory, sending photos, offering site visits, and notifying the right salesperson. A three-person team cannot do that consistently for seventy conversations a day.\n\nThey needed first-touch automation that still felt local and human—not a generic chatbot—and a way for the broker to see qualified leads, take over hot conversations, and stop burning money on silence.',
  why_built:
    'I built this because the request was concrete and the economics were impossible to ignore: a real business was paying to generate demand it could not operationally serve.\n\nMost "WhatsApp chatbot" products fail in Indian real estate for three predictable reasons. They reply in robotic Hindi when the user writes English. They invent listings instead of reading actual inventory. They treat every message as free-form chat, which makes qualification slow and inconsistent.\n\nI wanted to prove a different architecture: LLM for language and rapport, deterministic code for business rules, WhatsApp native UI for speed, and PostgreSQL for auditable lead state. The goal was not to replace brokers—it was to guarantee that every paid lead gets an immediate, useful first response and arrives at the sales team with budget, area, timeline, purpose, and matched properties already captured.\n\nSurat was the right first market: high WhatsApp usage, mixed Gujlish/English/Hinglish input, and brokers who already live on their phones but lack backend systems.',
  metrics: [
    { label: "Broker clients deployed in Surat (first month)", value: "12" },
    { label: "Typical daily inbound lead volume per broker", value: "60–70" },
    { label: "Leads previously left without any reply", value: "~90%" },
    { label: "First-response time with workflow active", value: "<30 sec" },
    {
      label: "Speed-to-lead advantage vs 30-min delay (published benchmark)",
      value: "21×",
    },
  ],
  approach: [
    "Meta WhatsApp Cloud API delivers inbound messages to an n8n WhatsApp Trigger; status-only webhooks are filtered out before processing.",
    "Build Session Context loads broker config, property inventory, prior PostgreSQL session JSON, and bot-takeover state for the phone number.",
    "Decide Response Mode routes each turn: GPT-4o chat, WhatsApp list/buttons, inventory shortlist, property photo send, or site-visit booking.",
    "Parse AI Response & Update State merges LLM output with a structured lead profile (budget, area, timeline, purpose, property type, language).",
    "Lead scoring assigns hot/warm/cold tiers; hot leads trigger instant WhatsApp alerts to the broker; qualified and site-visit rows persist to PostgreSQL.",
    "Next.js dashboard lets each broker manage inventory, view scored leads and transcripts, pause the bot for 24h human takeover, and onboard new tenants.",
  ],
  my_contribution: [
    "Designed the hybrid conversation architecture: LLM for language and rapport, deterministic JavaScript nodes for routing, inventory matching, and scoring.",
    "Authored the broker persona prompt and language-mirroring rules for English, Gujlish, and Hinglish—including edge cases like area-only replies.",
    "Built the full n8n workflow (~40+ nodes): session memory, interactive WhatsApp UI, shortlist formatting, Google Calendar site visits, broker hot-lead alerts.",
    "Implemented the Next.js multi-tenant dashboard: broker onboarding, inventory CRUD/import, lead panel, workflow export/deploy hooks, and human takeover.",
    "Created PostgreSQL schema and migration path for sessions, qualified leads, nurture tags, lead scores, property inventory, and bot pause windows.",
    "Deployed and supported 12 independent Surat brokers in production within one month, including Meta webhook/ngrok/Docker setup guidance.",
  ],
  ai_design_nodes: [
    {
      id: "wa_lead",
      type: "user",
      label: "WhatsApp Lead",
      description: "Inbound property inquiry via Meta WhatsApp",
      icon: "message-circle",
      position: { x: 40, y: 40 },
    },
    {
      id: "session_builder",
      type: "agent",
      label: "Session Context Builder",
      description:
        "Loads broker config, inventory, prior session JSON, takeover flag",
      icon: "layers",
      position: { x: 380, y: 40 },
    },
    {
      id: "mode_router",
      type: "agent",
      label: "Response Mode Router",
      description:
        "Chooses AI chat vs buttons, shortlist, photo, or site visit",
      icon: "git-branch",
      position: { x: 380, y: 220 },
    },
    {
      id: "gpt4o",
      type: "llm",
      label: "GPT-4o Qualifier",
      description:
        "Natural-language profiling with broker persona and language mirroring",
      icon: "brain",
      position: { x: 720, y: 40 },
    },
    {
      id: "interactive_ui",
      type: "tool",
      label: "WhatsApp Interactive UI",
      description:
        "Native lists and reply buttons for area, timeline, purpose, visit slots",
      icon: "mouse-pointer-click",
      position: { x: 720, y: 220 },
    },
    {
      id: "inventory_match",
      type: "database",
      label: "Inventory Matcher",
      description:
        "Filters active listings by type, area, budget; formats shortlist cards",
      icon: "database",
      position: { x: 720, y: 400 },
    },
    {
      id: "lead_scorer",
      type: "agent",
      label: "Lead Scorer",
      description:
        "Hot/warm/cold tiers from budget, urgency, area, purpose, site-visit intent",
      icon: "gauge",
      position: { x: 380, y: 400 },
    },
    {
      id: "broker_alert",
      type: "service",
      label: "Broker Alert & CRM Write",
      description:
        "WhatsApp hot-lead ping, qualified_lead row, dashboard visibility",
      icon: "bell",
      position: { x: 40, y: 400 },
    },
  ],
  ai_design_edges: [
    {
      id: "e1",
      source: "wa_lead",
      target: "session_builder",
      label: "inbound message",
      animated: false,
    },
    {
      id: "e2",
      source: "session_builder",
      target: "mode_router",
      label: "session + inventory",
      animated: false,
    },
    {
      id: "e3",
      source: "mode_router",
      target: "gpt4o",
      label: "free-text turn",
      animated: false,
    },
    {
      id: "e4",
      source: "mode_router",
      target: "interactive_ui",
      label: "structured slot",
      animated: true,
    },
    {
      id: "e5",
      source: "mode_router",
      target: "inventory_match",
      label: "profile complete",
      animated: true,
    },
    {
      id: "e6",
      source: "gpt4o",
      target: "lead_scorer",
      label: "updated profile",
      animated: false,
    },
    {
      id: "e7",
      source: "interactive_ui",
      target: "lead_scorer",
      label: "slot filled",
      animated: false,
    },
    {
      id: "e8",
      source: "inventory_match",
      target: "lead_scorer",
      label: "shortlist sent",
      animated: false,
    },
    {
      id: "e9",
      source: "lead_scorer",
      target: "broker_alert",
      label: "hot / qualified / visit booked",
      animated: true,
    },
  ],
  ai_design: null,
  architecture_nodes: [
    {
      id: "lead_phone",
      type: "user",
      label: "Lead (WhatsApp)",
      description: "Property buyer on mobile WhatsApp",
      icon: "smartphone",
      position: { x: 40, y: 40 },
    },
    {
      id: "meta_api",
      type: "service",
      label: "Meta WhatsApp Cloud API",
      description: "Webhook delivery + Graph API outbound messages/media",
      icon: "cloud",
      position: { x: 380, y: 40 },
    },
    {
      id: "n8n",
      type: "service",
      label: "n8n Workflow Engine",
      description:
        "Docker-hosted orchestration, ~40+ nodes per broker workflow",
      icon: "workflow",
      position: { x: 720, y: 40 },
    },
    {
      id: "postgres",
      type: "database",
      label: "PostgreSQL",
      description: "Sessions, leads, scores, inventory, bot takeover windows",
      icon: "database",
      position: { x: 720, y: 220 },
    },
    {
      id: "openai",
      type: "service",
      label: "OpenAI GPT-4o",
      description: "Conversational qualification layer",
      icon: "sparkles",
      position: { x: 380, y: 220 },
    },
    {
      id: "dashboard",
      type: "service",
      label: "Next.js Ops Dashboard",
      description: "Broker onboarding, inventory, leads, human takeover",
      icon: "layout-dashboard",
      position: { x: 40, y: 220 },
    },
    {
      id: "calendar",
      type: "service",
      label: "Google Calendar",
      description: "Site-visit event creation on slot selection",
      icon: "calendar",
      position: { x: 380, y: 400 },
    },
    {
      id: "broker_phone",
      type: "user",
      label: "Broker (WhatsApp + Dashboard)",
      description: "Hot-lead alerts and manual takeover",
      icon: "user-check",
      position: { x: 40, y: 400 },
    },
  ],
  architecture_edges: [
    {
      id: "a1",
      source: "lead_phone",
      target: "meta_api",
      label: "message",
      animated: false,
    },
    {
      id: "a2",
      source: "meta_api",
      target: "n8n",
      label: "HTTPS webhook",
      animated: true,
    },
    {
      id: "a3",
      source: "n8n",
      target: "openai",
      label: "prompt + history",
      animated: false,
    },
    {
      id: "a4",
      source: "n8n",
      target: "postgres",
      label: "read/write session & leads",
      animated: false,
    },
    {
      id: "a5",
      source: "n8n",
      target: "meta_api",
      label: "reply / lists / images",
      animated: true,
    },
    {
      id: "a6",
      source: "n8n",
      target: "calendar",
      label: "book visit",
      animated: false,
    },
    {
      id: "a7",
      source: "n8n",
      target: "broker_phone",
      label: "hot lead WhatsApp alert",
      animated: true,
    },
    {
      id: "a8",
      source: "dashboard",
      target: "postgres",
      label: "inventory & leads API",
      animated: false,
    },
    {
      id: "a9",
      source: "broker_phone",
      target: "dashboard",
      label: "takeover / resume bot",
      animated: false,
    },
  ],
  architecture: null,
  challenges: [
    {
      challenge:
        "Pure LLM chat was too slow and inconsistent for qualification—brokers needed structured data (budget, area, timeline) on every lead, not variable prose.",
      solution:
        "I split the system into Decide Response Mode: GPT-4o handles language and open questions; deterministic code nodes emit WhatsApp list pickers, reply buttons, inventory shortlists, and site-visit slot buttons when the profile state machine reaches the right step.",
    },
    {
      challenge:
        "Users in Surat switch between English, Gujlish, and Hinglish—or send ambiguous one-word replies like area names—which caused the bot to reply in the wrong language.",
      solution:
        "I built a language-utils layer with phrase detection, sticky session language, and explicit rules that area-only or budget-only messages do not trigger a language switch. The prompt hard-overrides Gujlish tokens when English is detected.",
    },
    {
      challenge:
        "The LLM would hallucinate listings or wrong property types (e.g., offering flats when the user asked for a bungalow not in inventory).",
      solution:
        "Inventory-backed matching runs in code, not in the model. The AI is instructed never to invent listings; Format Property Shortlist pulls active rows from PostgreSQL and the router blocks unavailable types with an interactive property-type picker.",
    },
    {
      challenge:
        "n8n in Docker could not reach localhost PostgreSQL on Windows, and Meta rejected localhost webhook URLs—breaking both persistence and WhatsApp trigger registration.",
      solution:
        "I configured Postgres credentials to use host.docker.internal, exposed n8n via ngrok with a fixed reserved domain, and set WEBHOOK_URL/N8N_HOST on the container. I packaged this into start.bat + docker-compose for repeatable broker deployments.",
    },
  ],
  tradeoffs: [
    {
      decision:
        "Hybrid n8n + code nodes instead of a single LangGraph/ custom Python agent service",
      alternative:
        "Dedicated FastAPI/LangGraph microservice with a thin WhatsApp adapter",
      reason:
        "Brokers and implementers can see, edit, and clone visual workflows; Meta and Postgres credentials stay in n8n; deployment time per broker dropped to hours.",
      tradeoff:
        "Complex routing logic is split across many n8n Code nodes and sync scripts—harder to unit-test than a monolithic repo.",
    },
    {
      decision:
        "GPT-4o for conversation quality on a high-stakes sales channel",
      alternative: "Smaller/cheaper model or template-only bot without LLM",
      reason:
        "Real estate first touch needs nuance, code-mixed language, and objection handling; cheaper models broke persona consistency in live Surat tests.",
      tradeoff:
        "Higher per-message inference cost at 60–70 daily conversations per broker; mitigated by routing structured steps to non-LLM paths.",
    },
    {
      decision:
        "Human takeover pauses the bot for 24 hours instead of full CRM replacement",
      alternative:
        "Always-on bot or full agent desktop with no automation pause",
      reason:
        "Brokers insisted they must jump in on hot leads without fighting the bot; paused inbound is still logged to session for context.",
      tradeoff:
        "If takeover is forgotten, automation stays off until expiry—acceptable for a small-team workflow.",
    },
  ],
  results: splitParagraphs(
    "Twelve independent real estate brokers in Surat were onboarded and running within one month. Each reported the same baseline before go-live: dozens of daily WhatsApp leads and a team too small to reply to most of them.\n\nWith the workflow active, every inbound message receives a first response in under thirty seconds during my production observations—compared to the industry reality of multi-hour delays that the HBR Lead Response Management study associates with a 21× drop in qualification odds versus a five-minute response.\n\nBrokers now receive structured lead profiles in the dashboard—name, property type, budget, area, timeline, purpose—and hot-tier leads trigger an immediate WhatsApp alert with the score breakdown. Site visits booked via interactive slot buttons write to qualified_leads and Google Calendar. All twelve clients completed the first month with positive feedback; the recurring theme was that their team finally replies to every paid lead while spending time only on conversations that are already qualified."
  ),
  learnings: splitParagraphs(
    'Speed-to-lead is not a marketing slogan in WhatsApp real estate—it is the product. If the architecture cannot reply in seconds, the LLM quality does not matter.\n\nHybrid beats pure LLM for vertical SaaS: models are excellent at language; code is excellent at inventory, scoring, and compliance-style flows. Mixing them in one n8n graph was the difference between a demo and something brokers paid to keep running.\n\nLocal language behavior is an engineering problem, not a prompt afterthought. Surat users do not speak one language per session; production required explicit detection, sticky state, and test cases for edge inputs like "Vesu" or "maru budget 1cr che."\n\nOps tooling is part of the AI product. Brokers trusted the system because they could see leads, pause the bot, and edit inventory—not because the chat sounded human.'
  ),
  ai_summary:
    "Dhruvil Patel built a production WhatsApp lead qualification platform for Surat real estate brokers using n8n, GPT-4o, Meta WhatsApp Cloud API, and PostgreSQL, with a Next.js multi-tenant dashboard. The system responds in seconds to 60–70 daily leads, profiles buyers via hybrid AI and native WhatsApp UI, matches real inventory, scores hot/warm/cold leads, books site visits, and alerts brokers. Deployed to 12 clients in one month. Problem framed against HBR Lead Response Management research showing 21× qualification advantage for five-minute vs thirty-minute response.",
  key_takeaways: [
    "Hybrid LLM + deterministic routing solves WhatsApp real estate qualification better than pure chatbots",
    "Sub-minute speed-to-lead directly addresses documented 21× conversion gap vs 30-minute delays",
    "Inventory-backed shortlists prevent hallucinated listings—a common failure mode in property AI",
    "Multi-tenant dashboard with human takeover makes automation acceptable to non-technical brokers",
    "12 Surat broker deployments in one month validates ops-ready design, not just a prototype",
  ],
  expertise_slugs: [
    "ai-engineering",
    "enterprise-automation",
    "ai-infrastructure",
  ],
  concepts: splitCommaList(
    "WhatsApp Automation, Lead Qualification, Speed-to-Lead, Hybrid LLM Routing, Multi-Tenant SaaS, Conversational AI, Lead Scoring, Human-in-the-Loop"
  ),
  technologies: splitCommaList(
    "n8n, GPT-4o, Meta WhatsApp Cloud API, PostgreSQL, Next.js, Prisma, Docker, ngrok, Google Calendar, TypeScript"
  ),
  project_facts: {
    role: "Applied AI Engineer — solo builder",
    team_size: "1",
    duration: "Multi-phase build + 1-month Surat rollout",
    deployment:
      "Dockerized n8n + PostgreSQL + Next.js dashboard; ngrok for Meta webhooks",
    scale: "12 broker tenants; ~60–70 inbound leads/day per broker",
    latency: "First WhatsApp reply typically under 30 seconds",
    market: "Surat, Gujarat real estate",
  },
  faq: [
    {
      question: "What problem does this project solve?",
      answer:
        "Small real estate teams in Surat generate 60–70 WhatsApp leads per day but reply to only a fraction. Unanswered leads waste ₹5,000–₹50,000 in acquisition cost per lead. HBR-published research shows a 21× qualification advantage when responding in five minutes versus thirty. This system guarantees instant first touch and structured qualification before a human sales rep joins.",
    },
    {
      question: "Why WhatsApp instead of a web form or CRM?",
      answer:
        "Surat property buyers already initiate on WhatsApp after Meta and portal ads. The bottleneck is not lead capture—it is first response and triage inside the chat app they already use. Building on WhatsApp Cloud API meets users where they are.",
    },
    {
      question: "How is it built technically?",
      answer:
        "An n8n workflow receives Meta webhooks, loads session state from PostgreSQL, routes each turn through Decide Response Mode to either GPT-4o or deterministic nodes for WhatsApp lists, inventory shortlists, photos, and site-visit booking. A Next.js dashboard manages brokers, inventory, scored leads, and 24-hour human takeover.",
    },
    {
      question: "What AI models and tools are used?",
      answer:
        "GPT-4o powers natural-language turns with a broker-specific persona prompt. Routing, scoring, inventory matching, and language detection run in JavaScript Code nodes. Meta WhatsApp Cloud API handles delivery; Google Calendar books visits.",
    },
    {
      question: "What was the real-world outcome?",
      answer:
        "Twelve Surat brokers deployed in one month. Clients reported that every paid lead now gets an immediate reply, qualified profiles appear in the dashboard, and hot leads trigger broker WhatsApp alerts—eliminating the ~90% no-reply gap they started with.",
    },
    {
      question: "What did you learn building it?",
      answer:
        "Pure LLM bots fail on inventory accuracy and structured data capture. Hybrid architecture—model for language, code for business rules—was essential. Local language mirroring and broker-facing ops UI were as important as model choice for adoption.",
    },
  ],
  timeline: [
    {
      period: "Week 1–2",
      title: "Core n8n workflow + WhatsApp integration",
      description:
        "WhatsApp Trigger, session memory in PostgreSQL, GPT-4o qualification prompt, basic reply loop, Docker/ngrok webhook setup.",
    },
    {
      period: "Week 3–4",
      title: "Hybrid routing & inventory shortlists",
      description:
        "Decide Response Mode, interactive lists/buttons, property matching, lead scoring, hot-lead broker alerts, site-visit booking.",
    },
    {
      period: "Week 5–6",
      title: "Next.js multi-broker dashboard",
      description:
        "Broker onboarding, inventory CRUD, leads panel, human takeover, workflow export/deploy, language and prompt hardening from live tests.",
    },
    {
      period: "Month 1 rollout",
      title: "12 Surat broker deployments",
      description:
        "Production onboarding for independent brokers; Meta credential setup, inventory seeding, and live WhatsApp qualification.",
    },
  ],
  gallery: null,
  demo_images: null,
  featured: true,
  display_order: 0,
  hover_preview_enabled: true,
  content: {
    version: 1,
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Research context: why speed-to-lead matters",
      },
      {
        type: "paragraph",
        content:
          "The business case for this build is grounded in published sales-operations research, not anecdote. The Lead Response Management study (Oldroyd, McFarland, Elkington), reported via Harvard Business Review, found that contacting a web lead within five minutes versus thirty minutes makes qualification 21 times more likely. Separate MIT Sloan and inside-sales research on online lead behavior consistently treats response latency as a top conversion lever.\n\nIn Indian real estate, where cost per lead commonly ranges from ₹5,000 to ₹50,000 depending on channel and city tier, a broker receiving 60–70 daily WhatsApp inquiries but replying to fewer than 10% is not merely understaffed—they are systematically destroying acquisition ROI. That was the exact scenario described by the operator who first asked me to build this.",
      },
      {
        type: "heading",
        level: 2,
        content: "What I shipped",
      },
      {
        type: "bullet_list",
        items: [
          "n8n workflow (~40+ nodes): WhatsApp Trigger → session load → mode router → GPT-4o or interactive UI → scoring → broker alert",
          "Structured lead profile: contact, property type, budget, area, timeline, purpose, site-visit state",
          "Inventory-backed shortlists and photo sends—no hallucinated listings",
          "Lead tiers: hot (≥70), warm (≥40), cold—with instant WhatsApp ping on hot leads",
          "Next.js dashboard: multi-broker onboarding, inventory manager, leads/transcripts, 24h human takeover",
          "Google Calendar integration for site-visit slot booking via WhatsApp buttons",
          "One-command local stack: Docker n8n + fixed ngrok domain + dashboard via start.bat",
        ],
      },
      {
        type: "callout",
        variant: "success",
        content:
          "Production rollout: 12 independent Surat real estate brokers live within one month. All clients reported that every inbound lead now receives an instant first touch—a direct fix for the ~90% no-reply problem they started with.",
      },
      {
        type: "quote",
        content:
          "Bro, I run a real estate business. We get around 60 to 70 leads every single day, but unfortunately, because we don't have a big enough team, nearly 90% of those leads never get a reply. Is there anything you can do about it?\n\n— Original WhatsApp message that started the project",
      },
    ],
  },
  published_at: new Date().toISOString(),
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local"
  )
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function insertProject() {
  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to check existing project: ${fetchError.message}`)
  }

  if (existing) {
    const { error } = await supabase
      .from("projects")
      .update(project)
      .eq("id", existing.id)
    if (error) {
      throw new Error(`Failed to update project: ${error.message}`)
    }
    console.log(`Updated existing project: ${SLUG} (${existing.id})`)
    return
  }

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })

  const payload = {
    ...project,
    display_order: count ?? 0,
  }

  const { data: inserted, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("id, slug, title")
    .single()

  if (error) {
    throw new Error(`Failed to insert project: ${error.message}`)
  }

  console.log(`Inserted project: ${inserted.title}`)
  console.log(`  slug: ${inserted.slug}`)
  console.log(`  id:   ${inserted.id}`)
}

insertProject().catch((error) => {
  console.error("Insert failed:", error.message)
  process.exit(1)
})

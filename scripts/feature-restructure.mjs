#!/usr/bin/env node
/**
 * Feature-based restructure: moves files and rewrites @/ imports.
 * Run: node scripts/feature-restructure.mjs [--dry-run]
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "src")
const DRY_RUN = process.argv.includes("--dry-run")

/** @type {Array<[string, string]>} */
const DIRECTORY_MOVES = [
  // ── Shared infrastructure ──
  ["components/ui", "shared/ui"],
  ["components/shared", "shared/components"],
  ["hooks", "shared/hooks"],
  ["types", "shared/types"],
  ["config", "shared/config"],
  ["assets", "shared/assets"],
  ["styles", "shared/styles"],
  ["lib/supabase", "shared/lib/supabase"],
  ["lib/auth", "shared/lib/auth"],
  ["lib/env", "shared/lib/env"],
  ["lib/security", "shared/lib/security"],
  ["lib/analytics", "shared/lib/analytics"],
  ["lib/monitoring", "shared/lib/monitoring"],
  ["lib/utils", "shared/lib/utils"],
  ["lib/constants", "shared/lib/constants"],
  ["lib/fonts", "shared/lib/fonts"],
  ["lib/images", "shared/lib/images"],
  ["lib/logging", "shared/lib/logging"],
  ["lib/debug", "shared/lib/debug"],

  // ── Admin feature ──
  ["components/admin", "features/admin/components"],
  ["lib/admin", "features/admin/lib"],
  ["lib/content-health", "features/admin/lib/content-health"],

  // ── Content system ──
  ["components/content", "features/content/components"],
  ["components/editor", "features/content/components/editor"],
  ["lib/content", "features/content/lib"],

  // ── Diagrams ──
  ["components/diagrams", "features/diagrams/components"],
  ["lib/diagrams", "features/diagrams/lib"],

  // ── SEO ──
  ["components/seo", "features/seo/components"],
  ["lib/seo", "features/seo/lib"],

  // ── AI infrastructure ──
  ["lib/ai", "features/ai/lib"],

  // ── Copilot ──
  ["lib/copilot", "features/copilot/lib"],

  // ── Deployment / launch ──
  ["lib/deployment", "features/deployment/lib"],

  // ── Knowledge base ──
  ["lib/knowledge", "features/knowledge-base/lib"],

  // ── Discovery & search ──
  ["lib/discovery", "features/discovery/lib"],
  ["lib/search", "features/discovery/lib/search"],

  // ── Job fit ──
  ["lib/job-fit", "features/job-fit/lib"],
  ["lib/public/job-fit-pdf", "features/job-fit/lib/pdf"],
  ["lib/public/job-fit-pdf-export.ts", "features/job-fit/lib/pdf-export.ts"],
  ["lib/public/job-description.ts", "features/job-fit/lib/job-description.ts"],
  [
    "lib/public/job-description-validation.ts",
    "features/job-fit/lib/job-description-validation.ts",
  ],
  ["lib/public/job-fit-history.ts", "features/job-fit/lib/job-fit-history.ts"],
  [
    "lib/public/job-fit-comparison-matrix.ts",
    "features/job-fit/lib/job-fit-comparison-matrix.ts",
  ],
  [
    "lib/public/job-fit-schedule.ts",
    "features/job-fit/lib/job-fit-schedule.ts",
  ],
  [
    "lib/public/job-fit-skill-chart.ts",
    "features/job-fit/lib/job-fit-skill-chart.ts",
  ],
  [
    "lib/public/parse-job-fit-result.ts",
    "features/job-fit/lib/parse-job-fit-result.ts",
  ],

  // ── About (snake game) ──
  ["lib/public/snake-game", "features/about/lib/snake-game"],
  ["lib/public/about-content.ts", "features/about/lib/about-content.ts"],

  // ── Personalization ──
  [
    "lib/public/visitor-interest",
    "features/personalization/lib/visitor-interest",
  ],

  // ── Site shell presence ──
  ["lib/public/presence", "features/site-shell/lib/presence"],

  // ── Portrait assets ──
  ["lib/portrait", "features/site-shell/lib/portrait"],

  // ── Remaining public data layer ──
  ["lib/public", "features/portfolio/lib"],
]

/** Public component file → feature folder */
const PUBLIC_COMPONENT_MAP = {
  // AI assistant
  "chat/assistant-chat-error.tsx": "ai-assistant/components",
  "chat/assistant-context.tsx": "ai-assistant/components",
  "chat/assistant-dock-button.tsx": "ai-assistant/components",
  "chat/assistant-input.tsx": "ai-assistant/components",
  "chat/assistant-lottie-icon.tsx": "ai-assistant/components",
  "chat/assistant-message.tsx": "ai-assistant/components",
  "chat/assistant-panel.tsx": "ai-assistant/components",
  "chat/assistant-shell.tsx": "ai-assistant/components",
  "chat/assistant-suggestions.tsx": "ai-assistant/components",
  "chat/mobile-assistant-layer.tsx": "ai-assistant/components",

  // Job fit
  "chat/job-fit-card.tsx": "job-fit/components",
  "chat/job-fit-comparison-modal.tsx": "job-fit/components",
  "chat/job-fit-contact-card.tsx": "job-fit/components",
  "chat/job-fit-export-pdf-button.tsx": "job-fit/components",
  "chat/job-fit-history-detail.tsx": "job-fit/components",
  "chat/job-fit-history-matrix.tsx": "job-fit/components",
  "chat/job-fit-history-panel.tsx": "job-fit/components",
  "chat/job-fit-seniority-hint.tsx": "job-fit/components",
  "chat/job-fit-skill-chart.tsx": "job-fit/components",

  // Site shell
  "analytics-provider.tsx": "site-shell/components",
  "dock-search-context.tsx": "site-shell/components",
  "dock-search-results.tsx": "site-shell/components",
  "dock-search.tsx": "site-shell/components",
  "error-boundary.tsx": "site-shell/components",
  "floating-dock.tsx": "site-shell/components",
  "page-breadcrumbs.tsx": "site-shell/components",
  "page-loading-shell.tsx": "site-shell/components",
  "public-error-state.tsx": "site-shell/components",
  "public-layout.tsx": "site-shell/components",
  "public-not-found-page.tsx": "site-shell/components",
  "scroll-progress.tsx": "site-shell/components",
  "site-footer.tsx": "site-shell/components",
  "site-header.tsx": "site-shell/components",
  "site-theme-provider.tsx": "site-shell/components",
  "site-theme-script.tsx": "site-shell/components",
  "smooth-scroll-provider.tsx": "site-shell/components",
  "theme-toggle.tsx": "site-shell/components",
  "view-tracker.tsx": "site-shell/components",
  "visitor-interest-tracker.tsx": "site-shell/components",
  "profile-avatar.tsx": "site-shell/components",
  "profile-workspace.tsx": "site-shell/components",
  "workspace-links.tsx": "site-shell/components",
  "avatar-activity-tooltip.tsx": "site-shell/components",
  "public-site-select.tsx": "site-shell/components",
  "hover-preview-card.tsx": "site-shell/components",
  "empty-state.tsx": "site-shell/components",
  "live-clock.tsx": "site-shell/components",
  "live-status-bubble.tsx": "site-shell/components",
  "encrypted-name.tsx": "site-shell/components",
  "public-content.tsx": "site-shell/components",

  // Home
  "home-page-content.tsx": "home/components",
  "home-about-section.tsx": "home/components",
  "section-reveal.tsx": "home/components",
  "proof-section.tsx": "home/components",
  "proof-metrics-list.tsx": "home/components",
  "skills-preview-section.tsx": "home/components",
  "skills-preview.tsx": "home/components",
  "projects-preview-section.tsx": "home/components",
  "projects-preview.tsx": "home/components",
  "writing-preview-section.tsx": "home/components",
  "research-preview-section.tsx": "home/components",
  "automation-preview-section.tsx": "home/components",
  "experience-preview-section.tsx": "home/components",
  "knowledge-section.tsx": "home/components",
  "ai-first-section.tsx": "home/components",
  "contact-section.tsx": "home/components",
  "faq-section.tsx": "home/components",
  "interactive-portrait.tsx": "home/components",
  "status-rotator.tsx": "home/components",
  "about-preview.tsx": "home/components",
  "skills-showcase.tsx": "home/components",
  "skills-education.tsx": "home/components",
  "skills-chip.tsx": "home/components",

  // Projects
  "project-case-study.tsx": "projects/components",
  "project-facts-grid.tsx": "projects/components",
  "project-list-entry.tsx": "projects/components",
  "project-preview-panel.tsx": "projects/components",
  "project-timeline.tsx": "projects/components",
  "projects-filter-submenu.tsx": "projects/components",
  "projects-list-filters.tsx": "projects/components",
  "projects-list-with-filters-lazy.tsx": "projects/components",
  "projects-list-with-filters.tsx": "projects/components",
  "projects-list.tsx": "projects/components",
  "related-projects.tsx": "projects/components",
  "case-study-carousel.tsx": "projects/components",
  "case-study-diagram.tsx": "projects/components",
  "case-study-figure.tsx": "projects/components",
  "case-study-section.tsx": "projects/components",
  "case-study-video.tsx": "projects/components",
  "demo-gallery.tsx": "projects/components",
  "challenge-list.tsx": "projects/components",
  "tradeoffs-list.tsx": "projects/components",
  "metrics-grid.tsx": "projects/components",
  "key-takeaways-list.tsx": "projects/components",
  "engineering-flow.tsx": "projects/components",
  "node-flow.tsx": "projects/components",
  "joint-flow-diagram-lazy.tsx": "projects/components",
  "joint-flow-diagram.tsx": "projects/components",

  // Writing
  "writing-list-entry.tsx": "writing/components",
  "writing-list.tsx": "writing/components",
  "writing-preview.tsx": "writing/components",

  // Research
  "research-list-entry.tsx": "research/components",
  "research-list.tsx": "research/components",
  "research-preview.tsx": "research/components",

  // Automations
  "automation-list-entry.tsx": "automations/components",
  "automation-list.tsx": "automations/components",
  "automation-preview.tsx": "automations/components",

  // Experience
  "experience-article.tsx": "experience/components",
  "experience-list-entry.tsx": "experience/components",
  "experience-list.tsx": "experience/components",
  "experience-preview.tsx": "experience/components",
  "experience-tech-stack.tsx": "experience/components",

  // Knowledge base
  "stack-list.tsx": "knowledge-base/components",
  "stack-pagination.tsx": "knowledge-base/components",
  "stack-shared.tsx": "knowledge-base/components",
  "stack-table-lazy.tsx": "knowledge-base/components",
  "stack-table.tsx": "knowledge-base/components",
  "kb-section.tsx": "knowledge-base/components",
  "knowledge-related-section.tsx": "knowledge-base/components",
  "content-knowledge-blocks.tsx": "knowledge-base/components",
  "content-shell.tsx": "knowledge-base/components",
  "expertise-area-card.tsx": "knowledge-base/components",
  "expertise-badges.tsx": "knowledge-base/components",
  "technology-hub-meta.tsx": "knowledge-base/components",
  "tech-stack-categories.tsx": "knowledge-base/components",

  // Discovery
  "discovery-provider.tsx": "discovery/components",
  "discovery-shell.tsx": "discovery/components",
  "discovery-ui.tsx": "discovery/components",
  "search-page-client.tsx": "discovery/components",
  "explore-page-client.tsx": "discovery/components",

  // About
  "about-highlight.tsx": "about/components",
  "about-page-content.tsx": "about/components",
  "about-portrait.tsx": "about/components",
  "about-scroll-paragraph.tsx": "about/components",
  "about-snake-game.tsx": "about/components",

  // Resume
  "resume-preview-lazy.tsx": "resume/components",
  "resume-preview.tsx": "resume/components",

  // Contact
  "contact-link.tsx": "contact/components",
  "copy-email-button.tsx": "contact/components",
  "thank-you-divider.tsx": "contact/components",

  // AI-first page
  "ai-first-automation-tools-table.tsx": "ai-first/components",
  "ai-first-keyword-chip.tsx": "ai-first/components",
  "ai-first-keyword-icons.tsx": "ai-first/components",
  "ai-first-keyword-preview-panel.tsx": "ai-first/components",
  "ai-first-keywords-list.tsx": "ai-first/components",
  "ai-first-page-content.tsx": "ai-first/components",
  "ai-summary-block.tsx": "ai-first/components",
}

/** @type {Array<[string, string]>} */
const SINGLE_FILE_MOVES = [
  ["lib/defer-idle.ts", "shared/lib/defer-idle.ts"],
  ["components/flip-words-demo.tsx", "archive/demos/flip-words-demo.tsx"],
  [
    "components/encrypted-text-demo-2.tsx",
    "archive/demos/encrypted-text-demo-2.tsx",
  ],
]

function ensureDir(dir) {
  if (!DRY_RUN && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function copyRecursiveSync(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    ensureDir(dest)
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    ensureDir(path.dirname(dest))
    fs.copyFileSync(src, dest)
  }
}

function removeRecursiveSync(target) {
  if (!fs.existsSync(target)) return
  const stat = fs.statSync(target)
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      removeRecursiveSync(path.join(target, entry))
    }
    fs.rmdirSync(target)
  } else {
    fs.unlinkSync(target)
  }
}

function movePath(fromRel, toRel) {
  const from = path.join(SRC, fromRel)
  const to = path.join(SRC, toRel)
  if (!fs.existsSync(from)) {
    console.warn(`  skip (missing): ${fromRel}`)
    return false
  }
  if (fs.existsSync(to)) {
    console.warn(`  skip (exists): ${toRel}`)
    return false
  }
  ensureDir(path.dirname(to))
  if (DRY_RUN) {
    console.log(`  [dry] ${fromRel} → ${toRel}`)
  } else {
    try {
      fs.renameSync(from, to)
    } catch (err) {
      if (err && (err.code === "EPERM" || err.code === "EXDEV")) {
        copyRecursiveSync(from, to)
        removeRecursiveSync(from)
      } else {
        throw err
      }
    }
    console.log(`  moved: ${fromRel} → ${toRel}`)
  }
  return true
}

function movePublicComponents() {
  const publicDir = path.join(SRC, "components/public")
  if (!fs.existsSync(publicDir)) return

  for (const [rel, destFeature] of Object.entries(PUBLIC_COMPONENT_MAP)) {
    movePath(
      `components/public/${rel}`,
      `features/${destFeature}/${path.basename(rel)}`
    )
  }

  // Move any remaining files in components/public to portfolio/components
  function walk(dir, base = "components/public") {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = `${base}/${entry.name}`
      const full = path.join(SRC, rel)
      if (entry.isDirectory()) {
        walk(full, rel)
      } else {
        movePath(rel, `features/portfolio/components/${entry.name}`)
      }
    }
  }
  walk(publicDir)
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirs(path.join(dir, entry.name))
    }
  }
  if (
    fs.readdirSync(dir).length === 0 &&
    dir !== SRC &&
    !dir.includes("node_modules")
  ) {
    if (!DRY_RUN) fs.rmdirSync(dir)
  }
}

function runMoves() {
  console.log("\n── Directory moves ──")
  // Order matters: move specific lib/public files before lib/public directory
  const ordered = [
    ...DIRECTORY_MOVES.filter(
      ([from]) => from.startsWith("lib/public/") && from !== "lib/public"
    ),
    ...DIRECTORY_MOVES.filter(
      ([from]) => !from.startsWith("lib/public/") || from === "lib/public"
    ),
  ]

  for (const [from, to] of ordered) {
    movePath(from, to)
  }

  console.log("\n── Public component moves ──")
  movePublicComponents()

  console.log("\n── Single file moves ──")
  for (const [from, to] of SINGLE_FILE_MOVES) {
    movePath(from, to)
  }

  // Move existing features/admin forms if still at old path
  if (fs.existsSync(path.join(SRC, "features/admin/forms"))) {
    movePath("features/admin/forms", "features/admin/components/forms")
  }
  if (fs.existsSync(path.join(SRC, "features/admin/login-form.tsx"))) {
    movePath(
      "features/admin/login-form.tsx",
      "features/admin/components/login-form.tsx"
    )
  }

  if (!DRY_RUN) {
    removeEmptyDirs(path.join(SRC, "components"))
    removeEmptyDirs(path.join(SRC, "lib"))
    removeEmptyDirs(path.join(SRC, "hooks"))
  }
}

/** Build import replacement rules from all moves */
function buildImportRules() {
  /** @type {Array<[RegExp, string]>} */
  const rules = []

  const prefixRules = [
    ["@/shared/ui/", "@/shared/ui/"],
    ["@/shared/components/", "@/shared/components/"],
    ["@/features/admin/components/", "@/features/admin/components/"],
    ["@/features/content/components/", "@/features/content/components/"],
    [
      "@/features/content/components/editor/",
      "@/features/content/components/editor/",
    ],
    ["@/features/diagrams/components/", "@/features/diagrams/components/"],
    ["@/features/seo/components/", "@/features/seo/components/"],
    [
      "@/features/ai-assistant/components/",
      "@/features/ai-assistant/components/",
    ],
    ["@/features/portfolio/components/", "@/features/portfolio/components/"],
    ["@/shared/hooks/", "@/shared/hooks/"],
    ["@/shared/types/", "@/shared/types/"],
    ["@/shared/config/", "@/shared/config/"],
    ["@/shared/assets/", "@/shared/assets/"],
    ["@/shared/styles/", "@/shared/styles/"],
    ["@/shared/lib/supabase/", "@/shared/lib/supabase/"],
    ["@/shared/lib/auth/", "@/shared/lib/auth/"],
    ["@/shared/lib/env/", "@/shared/lib/env/"],
    ["@/shared/lib/security/", "@/shared/lib/security/"],
    ["@/shared/lib/analytics/", "@/shared/lib/analytics/"],
    ["@/shared/lib/monitoring/", "@/shared/lib/monitoring/"],
    ["@/shared/lib/utils/", "@/shared/lib/utils/"],
    ["@/shared/lib/constants/", "@/shared/lib/constants/"],
    ["@/shared/lib/fonts/", "@/shared/lib/fonts/"],
    ["@/shared/lib/images/", "@/shared/lib/images/"],
    ["@/shared/lib/logging/", "@/shared/lib/logging/"],
    ["@/shared/lib/debug/", "@/shared/lib/debug/"],
    ["@/features/admin/lib/", "@/features/admin/lib/"],
    [
      "@/features/admin/lib/content-health/",
      "@/features/admin/lib/content-health/",
    ],
    ["@/features/content/lib/", "@/features/content/lib/"],
    ["@/features/diagrams/lib/", "@/features/diagrams/lib/"],
    ["@/features/seo/lib/", "@/features/seo/lib/"],
    ["@/features/ai/lib/", "@/features/ai/lib/"],
    ["@/features/copilot/lib/", "@/features/copilot/lib/"],
    ["@/features/deployment/lib/", "@/features/deployment/lib/"],
    ["@/features/knowledge-base/lib/", "@/features/knowledge-base/lib/"],
    ["@/features/discovery/lib/", "@/features/discovery/lib/"],
    ["@/features/discovery/lib/search/", "@/features/discovery/lib/search/"],
    ["@/features/job-fit/lib/", "@/features/job-fit/lib/"],
    [
      "@/features/site-shell/lib/portrait/",
      "@/features/site-shell/lib/portrait/",
    ],
    ["@/shared/lib/defer-idle", "@/shared/lib/defer-idle"],
    [
      "@/features/admin/components/forms/",
      "@/features/admin/components/forms/",
    ],
    [
      "@/features/admin/components/login-form",
      "@/features/admin/components/login-form",
    ],
  ]

  // Job-fit lib/public paths
  const jobFitRules = [
    ["@/features/job-fit/lib/pdf/", "@/features/job-fit/lib/pdf/"],
    ["@/features/job-fit/lib/pdf-export", "@/features/job-fit/lib/pdf-export"],
    [
      "@/features/job-fit/lib/job-description-validation",
      "@/features/job-fit/lib/job-description-validation",
    ],
    [
      "@/features/job-fit/lib/job-description",
      "@/features/job-fit/lib/job-description",
    ],
    [
      "@/features/job-fit/lib/job-fit-history",
      "@/features/job-fit/lib/job-fit-history",
    ],
    [
      "@/features/job-fit/lib/job-fit-comparison-matrix",
      "@/features/job-fit/lib/job-fit-comparison-matrix",
    ],
    [
      "@/features/job-fit/lib/job-fit-schedule",
      "@/features/job-fit/lib/job-fit-schedule",
    ],
    [
      "@/features/job-fit/lib/job-fit-skill-chart",
      "@/features/job-fit/lib/job-fit-skill-chart",
    ],
    [
      "@/features/job-fit/lib/parse-job-fit-result",
      "@/features/job-fit/lib/parse-job-fit-result",
    ],
    ["@/features/about/lib/snake-game/", "@/features/about/lib/snake-game/"],
    [
      "@/features/about/lib/about-content",
      "@/features/about/lib/about-content",
    ],
    [
      "@/features/personalization/lib/visitor-interest/",
      "@/features/personalization/lib/visitor-interest/",
    ],
    [
      "@/features/site-shell/lib/presence/",
      "@/features/site-shell/lib/presence/",
    ],
    ["@/features/portfolio/lib/", "@/features/portfolio/lib/"],
  ]

  // Public component specific imports (more specific first)
  for (const [rel, dest] of Object.entries(PUBLIC_COMPONENT_MAP)) {
    const file = path.basename(rel, path.extname(rel))
    prefixRules.push([
      `@/features/portfolio/components/${rel.replace(/\.tsx$/, "")}`,
      `@/features/${dest}/${file}`,
    ])
    prefixRules.push([
      `@/features/portfolio/components/${file}`,
      `@/features/${dest}/${file}`,
    ])
  }

  // Sort longest first to avoid partial replacements
  const allRules = [...prefixRules, ...jobFitRules].sort(
    (a, b) => b[0].length - a[0].length
  )

  for (const [from, to] of allRules) {
    rules.push([
      new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      to,
    ])
  }

  return rules
}

function rewriteImports() {
  console.log("\n── Rewriting imports ──")
  const rules = buildImportRules()
  const exts = new Set([".ts", ".tsx", ".mts", ".mjs"])
  let fileCount = 0
  let changeCount = 0

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue
        walk(full)
      } else if (exts.has(path.extname(entry.name))) {
        let content = fs.readFileSync(full, "utf8")
        const original = content
        for (const [pattern, replacement] of rules) {
          content = content.replace(pattern, replacement)
        }
        if (content !== original) {
          fileCount++
          changeCount++
          if (!DRY_RUN) fs.writeFileSync(full, content, "utf8")
        }
      }
    }
  }

  walk(ROOT)
  console.log(`  updated ${fileCount} files`)
}

function main() {
  console.log(DRY_RUN ? "DRY RUN" : "EXECUTING feature restructure")
  runMoves()
  rewriteImports()
  console.log("\nDone.")
}

main()

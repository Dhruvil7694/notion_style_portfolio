#!/usr/bin/env node
/** Fix barrel imports and remaining paths after feature restructure */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "src")

/** Exact module path replacements (longest first) */
const EXACT = [
  ["@/features/seo/lib", "@/features/seo/lib"],
  ["@/shared/lib/utils", "@/shared/lib/utils"],
  ["@/shared/lib/auth", "@/shared/lib/auth"],
  ["@/shared/lib/env", "@/shared/lib/env"],
  ["@/shared/lib/supabase", "@/shared/lib/supabase"],
  ["@/shared/lib/security", "@/shared/lib/security"],
  ["@/shared/lib/analytics", "@/shared/lib/analytics"],
  ["@/shared/lib/monitoring", "@/shared/lib/monitoring"],
  ["@/shared/lib/constants", "@/shared/lib/constants"],
  ["@/shared/lib/images", "@/shared/lib/images"],
  ["@/shared/lib/logging", "@/shared/lib/logging"],
  ["@/features/admin/lib", "@/features/admin/lib"],
  ["@/features/content/lib", "@/features/content/lib"],
  [
    "@/features/admin/lib/content-health",
    "@/features/admin/lib/content-health",
  ],
  ["@/features/diagrams/lib", "@/features/diagrams/lib"],
  ["@/features/ai/lib", "@/features/ai/lib"],
  ["@/features/copilot/lib", "@/features/copilot/lib"],
  ["@/features/deployment/lib", "@/features/deployment/lib"],
  ["@/features/knowledge-base/lib", "@/features/knowledge-base/lib"],
  ["@/features/discovery/lib", "@/features/discovery/lib"],
  ["@/features/discovery/lib/search", "@/features/discovery/lib/search"],
  ["@/features/job-fit/lib", "@/features/job-fit/lib"],
  ["@/features/portfolio/lib", "@/features/portfolio/lib"],
  ["@/features/site-shell/lib/portrait", "@/features/site-shell/lib/portrait"],
  ["@/features/admin/components", "@/features/admin/components"],
  ["@/shared/ui", "@/shared/ui"],
  ["@/shared/components", "@/shared/components"],
  ["@/features/content/components", "@/features/content/components"],
  [
    "@/features/content/components/editor",
    "@/features/content/components/editor",
  ],
  ["@/features/diagrams/components", "@/features/diagrams/components"],
  ["@/features/seo/components", "@/features/seo/components"],
  ["@/shared/hooks", "@/shared/hooks"],
  ["@/shared/types", "@/shared/types"],
  ["@/shared/config", "@/shared/config"],
  ["@/shared/assets", "@/shared/assets"],
  ["@/shared/styles", "@/shared/styles"],
  ["@/features/admin/components/forms", "@/features/admin/components/forms"],
]

const ROOT_FILE_FIXES = [
  ["./src/lib/security/headers", "./src/shared/lib/security/headers"],
]

function copyRecursiveSync(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

function removeRecursiveSync(target) {
  if (!fs.existsSync(target)) return
  if (fs.statSync(target).isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      removeRecursiveSync(path.join(target, entry))
    }
    fs.rmdirSync(target)
  } else {
    fs.unlinkSync(target)
  }
}

function moveRemainingLib() {
  const libDir = path.join(SRC, "lib")
  if (!fs.existsSync(libDir)) return
  for (const entry of fs.readdirSync(libDir, { withFileTypes: true })) {
    const from = path.join(libDir, entry.name)
    let dest
    if (entry.name === "job-fit") {
      dest = path.join(SRC, "features/job-fit/lib")
    } else if (entry.name === "icons") {
      dest = path.join(SRC, "shared/lib/icons")
    } else {
      console.warn(`  unknown lib/${entry.name} — manual review needed`)
      continue
    }
    if (entry.isDirectory()) {
      for (const f of fs.readdirSync(from)) {
        const to = path.join(dest, f)
        if (!fs.existsSync(to)) {
          try {
            fs.renameSync(path.join(from, f), to)
          } catch {
            copyRecursiveSync(path.join(from, f), to)
            removeRecursiveSync(path.join(from, f))
          }
          console.log(`  moved lib/${entry.name}/${f}`)
        }
      }
    }
  }
  removeRecursiveSync(libDir)
}

function mergeAdminForms() {
  const oldForms = path.join(SRC, "features/admin/forms")
  const newForms = path.join(SRC, "features/admin/components/forms")
  if (!fs.existsSync(oldForms)) return
  fs.mkdirSync(newForms, { recursive: true })
  for (const file of fs.readdirSync(oldForms)) {
    const from = path.join(oldForms, file)
    const to = path.join(newForms, file)
    if (!fs.existsSync(to)) {
      fs.renameSync(from, to)
      console.log(`  merged forms/${file}`)
    }
  }
  removeRecursiveSync(oldForms)
}

function rewriteFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8")
  const original = content
  for (const [from, to] of EXACT) {
    content = content.replaceAll(`"${from}"`, `"${to}"`)
    content = content.replaceAll(`'${from}'`, `'${to}'`)
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8")
    return true
  }
  return false
}

function walkAndRewrite(dir) {
  const exts = new Set([".ts", ".tsx", ".mts", ".mjs"])
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      count += walkAndRewrite(full)
    } else if (exts.has(path.extname(entry.name))) {
      if (rewriteFile(full)) count++
    }
  }
  return count
}

function fixRootFiles() {
  for (const [from, to] of ROOT_FILE_FIXES) {
    for (const file of ["next.config.ts", "next.config.mjs"]) {
      const fp = path.join(ROOT, file)
      if (!fs.existsSync(fp)) continue
      let content = fs.readFileSync(fp, "utf8")
      if (content.includes(from)) {
        content = content.replaceAll(from, to)
        fs.writeFileSync(fp, content, "utf8")
        console.log(`  fixed ${file}`)
      }
    }
  }
}

console.log("── Remaining lib moves ──")
moveRemainingLib()
console.log("── Merge admin forms ──")
mergeAdminForms()
console.log("── Fix barrel imports ──")
const n = walkAndRewrite(ROOT)
console.log(`  updated ${n} files`)
console.log("── Fix root config imports ──")
fixRootFiles()
console.log("Done.")

#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, "src")

const FORBIDDEN_CLIENT_PATTERNS = [
  { label: "SUPABASE_SECRET_KEY", pattern: /SUPABASE_SECRET_KEY/ },
  { label: "service_role", pattern: /service_role/i },
  { label: "createAdminClient import", pattern: /from ["']@\/lib\/supabase\/admin["']/ },
  { label: "admin.ts import", pattern: /from ["'][^"']*supabase\/admin["']/ },
]

const REQUIRED_RLS_TABLES = [
  "projects",
  "experience",
  "content",
  "skills",
  "education",
  "settings",
  "resumes",
  "contact_submissions",
  "technology_registry",
  "concept_registry",
  "expertise_areas",
]

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }

    if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function isClientModule(source) {
  return (
    /^\s*["']use client["'];?\s*$/m.test(source) ||
    /^\s*["']use client["'];?\s*\n/.test(source)
  )
}

async function auditClientSecrets() {
  const files = await walk(SRC_DIR)
  const violations = []

  for (const file of files) {
    const source = await readFile(file, "utf8")
    if (!isClientModule(source)) {
      continue
    }

    for (const rule of FORBIDDEN_CLIENT_PATTERNS) {
      if (rule.pattern.test(source)) {
        violations.push({
          file: path.relative(ROOT, file),
          rule: rule.label,
        })
      }
    }
  }

  return violations
}

async function auditServerOnlyAdminImports() {
  const files = await walk(SRC_DIR)
  const violations = []

  for (const file of files) {
    if (file.includes(`${path.sep}lib${path.sep}supabase${path.sep}admin.`)) {
      continue
    }

    const source = await readFile(file, "utf8")
    if (!/from ["']@\/lib\/supabase\/admin["']/.test(source)) {
      continue
    }

    if (
      source.includes('"use server"') ||
      source.includes("'use server'") ||
      source.includes('"server-only"') ||
      source.includes("'server-only'")
    ) {
      continue
    }

    violations.push({
      file: path.relative(ROOT, file),
      rule: "admin client imported from non-server-action module",
    })
  }

  return violations
}

async function auditRlsCoverage() {
  const migrationsDir = path.join(ROOT, "supabase", "migrations")
  const migrationFiles = await readdir(migrationsDir)
  const sql = await Promise.all(
    migrationFiles
      .filter((file) => file.endsWith(".sql"))
      .map((file) => readFile(path.join(migrationsDir, file), "utf8"))
  )

  const combined = sql.join("\n")
  const missing = REQUIRED_RLS_TABLES.filter((table) => {
    const pattern = new RegExp(
      `alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`,
      "i"
    )
    return !pattern.test(combined)
  })

  return missing
}

async function main() {
  const clientViolations = await auditClientSecrets()
  const adminViolations = await auditServerOnlyAdminImports()
  const missingRls = await auditRlsCoverage()

  let failed = false

  if (clientViolations.length > 0) {
    failed = true
    console.error("Client bundle secret audit failed:")
    for (const violation of clientViolations) {
      console.error(`  - ${violation.file}: ${violation.rule}`)
    }
  } else {
    console.log("Client bundle secret audit passed.")
  }

  if (adminViolations.length > 0) {
    failed = true
    console.error("Server-only admin import audit failed:")
    for (const violation of adminViolations) {
      console.error(`  - ${violation.file}: ${violation.rule}`)
    }
  } else {
    console.log("Server-only admin import audit passed.")
  }

  if (missingRls.length > 0) {
    failed = true
    console.error("RLS coverage audit failed. Missing ENABLE ROW LEVEL SECURITY for:")
    for (const table of missingRls) {
      console.error(`  - ${table}`)
    }
  } else {
    console.log("RLS coverage audit passed.")
  }

  if (failed) {
    process.exitCode = 1
    return
  }

  console.log("Public security audit passed.")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

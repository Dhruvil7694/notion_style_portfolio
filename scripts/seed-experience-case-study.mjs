#!/usr/bin/env node
/**
 * Backfill structured case_study JSON on experience rows (no full re-seed).
 * Usage: npm run db:seed-experience-case-study
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

import { EXPERIENCE_CASE_STUDY_BY_COMPANY } from "./experience-case-study-data.mjs"

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

async function main() {
  const { data: rows, error } = await supabase
    .from("experience")
    .select("id, company")
  if (error) throw new Error(error.message)

  for (const row of rows ?? []) {
    const caseStudy = EXPERIENCE_CASE_STUDY_BY_COMPANY[row.company]
    if (!caseStudy) {
      console.warn(`No case study seed for company: ${row.company}`)
      continue
    }

    const { error: updateError } = await supabase
      .from("experience")
      .update({ case_study: caseStudy })
      .eq("id", row.id)

    if (updateError) {
      throw new Error(`Failed to update ${row.company}: ${updateError.message}`)
    }

    console.log(`Updated case_study for ${row.company}`)
  }

  console.log("Experience case study backfill complete.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

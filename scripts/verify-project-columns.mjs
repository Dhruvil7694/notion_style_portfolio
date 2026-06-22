#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

function loadEnv() {
  const values = {}
  for (const name of [".env.local", ".env"]) {
    const envPath = resolve(process.cwd(), name)
    if (!existsSync(envPath)) continue
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex <= 0) continue
      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      values[key] = value
    }
  }
  return values
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const columns = [
  "gallery",
  "thumbnail",
  "demo_video_url",
  "architecture_image",
  "architecture_nodes",
  "ai_design_nodes",
]

let missing = 0

for (const column of columns) {
  const { error } = await supabase.from("projects").select(column).limit(1)
  if (error) {
    console.log(`${column}: MISSING (${error.message})`)
    missing += 1
  } else {
    console.log(`${column}: OK`)
  }
}

process.exit(missing > 0 ? 1 : 0)

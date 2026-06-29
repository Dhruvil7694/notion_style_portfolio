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
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const i = t.indexOf("=")
      if (i <= 0) continue
      values[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
  }
  return values
}

const env = loadEnv()
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY
)

const { data, error } = await supabase
  .from("projects")
  .select("slug, title, status, featured, published_at, display_order")
  .order("display_order")

console.log(JSON.stringify({ error, projects: data }, null, 2))

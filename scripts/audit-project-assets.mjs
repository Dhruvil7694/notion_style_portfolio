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
      const i = trimmed.indexOf("=")
      if (i <= 0) continue
      values[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")
    }
  }
  return values
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase
  .from("projects")
  .select("slug, cover_image, thumbnail, gallery, demo_images, demo_video_url, architecture_image")
  .order("slug")

if (error) {
  console.error(error.message)
  process.exit(1)
}

for (const project of data ?? []) {
  const galleryCount = Array.isArray(project.gallery) ? project.gallery.length : 0
  const demoCount = Array.isArray(project.demo_images) ? project.demo_images.length : 0
  console.log(
    [
      project.slug,
      `cover=${project.cover_image ? "yes" : "no"}`,
      `gallery=${galleryCount}`,
      `demo_legacy=${demoCount}`,
      `video=${project.demo_video_url ? "yes" : "no"}`,
      `arch_img=${project.architecture_image ? "yes" : "no"}`,
    ].join(" | ")
  )
}

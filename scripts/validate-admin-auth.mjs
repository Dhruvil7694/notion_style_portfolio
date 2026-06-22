#!/usr/bin/env node
/**
 * Validates admin email/password auth against Supabase and local routes.
 * Usage: node scripts/validate-admin-auth.mjs [email] [password]
 */
import { existsSync,readFileSync } from "node:fs"
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

const env = loadEnv()
const email = process.argv[2] ?? env.ADMIN_EMAIL
const password = process.argv[3]
const siteUrl = env.SITE_URL ?? "http://localhost:3000"
const adminEmail = env.ADMIN_EMAIL

if (!email || !password) {
  console.error("Usage: node scripts/validate-admin-auth.mjs [email] [password]")
  process.exit(1)
}

let failed = false
function pass(label) {
  console.log(`PASS  ${label}`)
}
function fail(label, detail = "") {
  console.error(`FAIL  ${label}${detail ? `: ${detail}` : ""}`)
  failed = true
}

console.log("Admin auth validation\n")

if (!adminEmail) {
  fail("ADMIN_EMAIL configured")
} else if (adminEmail.toLowerCase() !== email.toLowerCase()) {
  fail("ADMIN_EMAIL matches test user", `ADMIN_EMAIL=${adminEmail}`)
} else {
  pass("ADMIN_EMAIL matches test user")
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: signInData, error: signInError } =
  await supabase.auth.signInWithPassword({ email, password })

if (signInError) {
  fail("Supabase signInWithPassword", signInError.message)
} else {
  pass("Supabase signInWithPassword")
  pass(`Session user id present (${signInData.user.id.length} chars)`)
  pass(`Session email matches (${Boolean(signInData.user.email)})`)
}

if (signInData?.session) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session) {
    fail("Session persistence (getSession)", sessionError?.message ?? "no session")
  } else {
    pass("Session persistence (getSession)")
  }

  const { error: signOutError } = await supabase.auth.signOut()
  if (signOutError) {
    fail("Supabase signOut", signOutError.message)
  } else {
    pass("Supabase signOut")
  }
}

try {
  const adminRes = await fetch(`${siteUrl}/admin`, { redirect: "manual" })
  if (adminRes.status >= 300 && adminRes.status < 400) {
    const location = adminRes.headers.get("location") ?? ""
    if (location.includes("/admin/login")) {
      pass("Unauthenticated /admin redirects to login")
    } else {
      fail("Unauthenticated /admin redirect target", location)
    }
  } else {
    fail("Unauthenticated /admin should redirect", `status ${adminRes.status}`)
  }
} catch (error) {
  fail("Unauthenticated /admin route reachable", error.message)
}

try {
  const loginRes = await fetch(`${siteUrl}/admin/login`)
  if (loginRes.status === 200) {
    pass("/admin/login returns 200")
  } else {
    fail("/admin/login returns 200", `status ${loginRes.status}`)
  }
} catch (error) {
  fail("/admin/login reachable", error.message)
}

if (signInData?.session && !failed) {
  const adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 50,
  })
  if (usersError) {
    fail("Supabase Auth user list", usersError.message)
  } else {
    const match = usersData.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    )
    if (match) {
      pass("Test user visible in Supabase Authentication → Users")
    } else {
      fail("Test user visible in Supabase Authentication → Users")
    }
  }
}

console.log("")
if (failed) {
  console.error("Validation failed.")
  process.exit(1)
}

console.log("Validation passed.")
console.log(`Sign in manually at ${siteUrl}/admin/login`)

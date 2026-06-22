import { NextResponse } from "next/server"

import { getServerEnv } from "@/lib/env/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const { SITE_URL } = getServerEnv()
  return NextResponse.redirect(`${SITE_URL}/admin/login`)
}

export async function POST() {
  return GET()
}

import { type NextRequest, NextResponse } from "next/server"

import { createClient } from "@/shared/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL("/admin/login", request.url))
}

export async function POST(request: NextRequest) {
  return GET(request)
}

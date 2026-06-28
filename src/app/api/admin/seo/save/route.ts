import { NextResponse } from "next/server"

import {
  revalidatePublicContent,
  revalidatePublicProjects,
} from "@/features/portfolio/lib/revalidate-cache"
import { requireAdmin } from "@/shared/lib/auth"
import { createAdminClient } from "@/shared/lib/supabase/admin"

type SaveBody = {
  table: "projects" | "content"
  id: string
  seo_title: string
  seo_description: string
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  )
}

export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin()

  let body: SaveBody
  try {
    body = (await request.json()) as SaveBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { table, id, seo_title, seo_description } = body

  if (table !== "projects" && table !== "content") {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 })
  }
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }
  if (
    typeof seo_title !== "string" ||
    seo_title.length < 1 ||
    seo_title.length > 70
  ) {
    return NextResponse.json(
      { error: "seo_title must be 1–70 chars" },
      { status: 422 }
    )
  }
  if (
    typeof seo_description !== "string" ||
    seo_description.length < 1 ||
    seo_description.length > 160
  ) {
    return NextResponse.json(
      { error: "seo_description must be 1–160 chars" },
      { status: 422 }
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from(table)
    .update({
      seo_title,
      seo_description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[seo/save]", error.message)
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 }
    )
  }

  if (table === "projects") {
    revalidatePublicProjects()
  } else {
    revalidatePublicContent()
  }

  return NextResponse.json({
    ok: true,
    newSeoTitle: seo_title,
    newSeoDescription: seo_description,
  })
}

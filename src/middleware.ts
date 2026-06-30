import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

function isPublicAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname === "/admin/unauthorized" ||
    pathname === "/admin/logout"
  )
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value)
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin") && !isPublicAdminPath(pathname) && !user) {
    const redirectResponse = NextResponse.redirect(
      new URL("/admin/login", request.url)
    )
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  if (pathname === "/admin/login" && user) {
    const redirectResponse = NextResponse.redirect(
      new URL("/admin", request.url)
    )
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  response.headers.set("x-pathname", pathname)

  return response
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}

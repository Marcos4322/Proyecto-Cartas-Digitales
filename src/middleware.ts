import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DEMO_SLUG = 'la-taberna-del-puerto'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute     = pathname.startsWith('/admin')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isQrRoute        = pathname.startsWith('/qr')

  if (!isAdminRoute && !isDashboardRoute && !isQrRoute) {
    return NextResponse.next()
  }

  // Permitir acceso al slug demo sin login
  const slugMatch = pathname.match(/\/(?:admin|dashboard|qr)\/([^/]+)/)
  const slug = slugMatch?.[1]

  if (slug === DEMO_SLUG) {
    return NextResponse.next()
  }

  // Verificar sesion
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/qr/:path*'],
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Subdomain → tenant rewriting
//
// `sage.example.com/<path>` is transparently rewritten to `/s/sage/<path>` so
// the app serves tenant content while the address bar still reads the tenant
// subdomain. Paths that are tenant-agnostic (auth pages, superadmin, already
// tenant-scoped /s/*, APIs, static assets) are left alone so they behave the
// same on any host.
//
// Known slugs are cached in-process with a short TTL so we don't hit the DB
// on every request. Newly approved schools start routing within CACHE_TTL_MS
// — if you need it instant, redeploy.
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60_000
let slugCache: { slugs: Set<string>; at: number } | null = null

async function getKnownSlugs(): Promise<Set<string>> {
  if (slugCache && Date.now() - slugCache.at < CACHE_TTL_MS) return slugCache.slugs
  const { data } = await supabaseAdmin.from('schools').select('slug')
  const slugs = new Set(((data ?? []) as { slug: string }[]).map(s => s.slug))
  slugCache = { slugs, at: Date.now() }
  return slugs
}

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0] // strip port
  if (!hostname) return null

  const parts = hostname.split('.')
  let sub: string | null = null

  if (parts.length === 2 && parts[1] === 'localhost') {
    // sage.localhost
    sub = parts[0]
  } else if (parts.length >= 3) {
    // sage.domain.com / sage.domain.co.uk — take the leftmost label
    sub = parts[0]
  }

  if (!sub) return null
  const reserved = new Set(['www', 'api', 'admin', 'app', 'staging', 'preview', 'dev'])
  if (reserved.has(sub.toLowerCase())) return null
  return sub.toLowerCase()
}

function isPassThroughPath(pathname: string): boolean {
  return (
    pathname.startsWith('/s/') ||
    pathname.startsWith('/admin/') ||
    pathname === '/admin' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/request-school' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')
  )
}

// Compute the rewrite URL for a tenant subdomain, or null if no rewrite is
// needed. This lives outside the proxy function so we can both rewrite AND
// use the rewritten path for the auth decision below.
async function resolveTenantRewrite(request: NextRequest): Promise<URL | null> {
  const host = request.headers.get('host') ?? ''
  const sub = extractSubdomain(host)
  if (!sub) return null

  const pathname = request.nextUrl.pathname
  if (isPassThroughPath(pathname)) return null

  const slugs = await getKnownSlugs()
  if (!slugs.has(sub)) return null

  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/s/${sub}` : `/s/${sub}${pathname}`
  return url
}

// ---------------------------------------------------------------------------
// Proxy entry point
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  // 1. Subdomain routing. Compute this first so the auth check below sees
  //    the effective tenant-scoped path, not the surface path the visitor
  //    typed into their address bar.
  const tenantRewriteUrl = await resolveTenantRewrite(request)
  const effectivePathname = tenantRewriteUrl?.pathname ?? request.nextUrl.pathname

  // 2. Supabase session hydration — mirrors cookies so Server Components
  //    and Route Handlers can read the logged-in user.
  let supabaseResponse = tenantRewriteUrl
    ? NextResponse.rewrite(tenantRewriteUrl, { request })
    : NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = tenantRewriteUrl
            ? NextResponse.rewrite(tenantRewriteUrl, { request })
            : NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 3. Auth gate for protected routes. Checks the EFFECTIVE path (post-
  //    rewrite) so `sage.example.com/dashboard` is protected the same way
  //    as `example.com/s/sage/dashboard`.
  const isProtected =
    effectivePathname.startsWith('/dashboard') ||
    effectivePathname.startsWith('/submit') ||
    effectivePathname.startsWith('/profile') ||
    effectivePathname.startsWith('/admin') ||
    effectivePathname.startsWith('/search') ||
    /^\/s\/[^/]+\/(dashboard|submit|profile|admin|search)/.test(effectivePathname)

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

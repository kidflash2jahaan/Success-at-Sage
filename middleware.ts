import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Subdomain → tenant rewriting.
//
// If the request host is something like `sage.example.com`, we transparently
// rewrite the URL so the app serves tenant content from /s/sage/*. The user
// keeps seeing `sage.example.com/dashboard` in their address bar, while the
// server renders /s/sage/dashboard under the hood.
//
// Paths that are tenant-agnostic (global auth pages, superadmin routes,
// already-tenant-scoped /s/*, API endpoints, static assets) are left alone
// so they behave the same on any host.
//
// Known slugs are cached in-process with a short TTL so middleware doesn't
// hit the database on every request. When a new school is approved, the
// cache refreshes within CACHE_TTL_MS — if you need it instant, redeploy.

const CACHE_TTL_MS = 60_000
let slugCache: { slugs: Set<string>; at: number } | null = null

async function getKnownSlugs(): Promise<Set<string>> {
  if (slugCache && Date.now() - slugCache.at < CACHE_TTL_MS) return slugCache.slugs
  const { data } = await supabaseAdmin.from('schools').select('slug')
  const slugs = new Set(((data ?? []) as { slug: string }[]).map(s => s.slug))
  slugCache = { slugs, at: Date.now() }
  return slugs
}

// Extract a plausible tenant subdomain from a host. Returns null for bare
// domains, localhost without a subdomain, or reserved labels (www, api).
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

// Paths that should NEVER be rewritten. These are tenant-agnostic or
// already tenant-scoped, and must behave identically on any host.
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

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const sub = extractSubdomain(host)
  if (!sub) return NextResponse.next()

  const pathname = req.nextUrl.pathname
  if (isPassThroughPath(pathname)) return NextResponse.next()

  const slugs = await getKnownSlugs()
  if (!slugs.has(sub)) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = pathname === '/' ? `/s/${sub}` : `/s/${sub}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Skip Next internals, the favicon, and anything with a file extension
  // (images, manifests, fonts, etc.). Everything else is a candidate for
  // tenant rewriting.
  matcher: ['/((?!_next/|favicon\\.ico|.*\\..*).*)'],
}

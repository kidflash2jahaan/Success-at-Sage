import type { NextConfig } from "next";

// Phase 5 domain cutover — set PRIMARY_DOMAIN env var to your newly
// purchased domain (e.g. "successaths.com") to activate host-based
// 301 redirects from the old brand domain. If unset, no host-based
// redirects fire (safe default).
const PRIMARY_DOMAIN = process.env.PRIMARY_DOMAIN?.trim()
const OLD_DOMAIN = 'successatsage.com'

const nextConfig: NextConfig = {
  async redirects() {
    const hostRedirects = PRIMARY_DOMAIN && PRIMARY_DOMAIN !== OLD_DOMAIN
      ? [
          {
            source: '/:path*',
            has: [{ type: 'host' as const, value: OLD_DOMAIN }],
            destination: `https://${PRIMARY_DOMAIN}/s/sage/:path*`,
            permanent: true,
          },
          {
            source: '/:path*',
            has: [{ type: 'host' as const, value: `www.${OLD_DOMAIN}` }],
            destination: `https://${PRIMARY_DOMAIN}/s/sage/:path*`,
            permanent: true,
          },
        ]
      : []

    return [
      ...hostRedirects,
      // Phase 3: old flat paths → Sage tenant-scoped paths. Permanent
      // 301s preserve inbound links, QR codes, printed posters. Sage's
      // slug is hardcoded since it's the flagship and these old paths
      // only ever served Sage.
      //
      // Phase 4b carve-outs: /admin/schools and /admin/impersonate are
      // SUPERADMIN-only routes that are tenant-agnostic and live at the
      // root (app/admin/). They must NOT redirect into /s/sage/admin/*.
      // The carve-outs use `missing` conditions on the catchall rule and
      // explicit earlier rules for the remaining admin sub-paths.
      { source: '/dashboard',                    destination: '/s/sage/dashboard',            permanent: true },
      { source: '/leaderboard',                  destination: '/s/sage/leaderboard',          permanent: true },
      { source: '/browse',                       destination: '/s/sage/browse',               permanent: true },
      { source: '/submit',                       destination: '/s/sage/submit',               permanent: true },
      { source: '/profile',                      destination: '/s/sage/profile',              permanent: true },
      { source: '/profile/edit/:id',             destination: '/s/sage/profile/edit/:id',     permanent: true },
      { source: '/courses/:slug',                destination: '/s/sage/courses/:slug',        permanent: true },
      { source: '/courses/:slug/units/:id',      destination: '/s/sage/courses/:slug/units/:id', permanent: true },
      { source: '/trending',                     destination: '/s/sage/trending',             permanent: true },
      { source: '/search',                       destination: '/s/sage/search',               permanent: true },
      { source: '/onboarding',                   destination: '/s/sage/onboarding',           permanent: true },

      // /admin: the Phase-3 rule was too greedy; it caught /admin/schools
      // (Phase 4b superadmin route). Replace with explicit per-path rules
      // for the tenant-admin paths that moved.
      { source: '/admin',                        destination: '/s/sage/admin',                permanent: true },
      { source: '/admin/contest',                destination: '/s/sage/admin/contest',        permanent: true },
      { source: '/admin/courses',                destination: '/s/sage/admin/courses',        permanent: true },
      { source: '/admin/submissions',            destination: '/s/sage/admin/submissions',    permanent: true },
      { source: '/admin/users',                  destination: '/s/sage/admin/users',          permanent: true },
      { source: '/admin/users/:id',              destination: '/s/sage/admin/users/:id',      permanent: true },
      // Note: /admin/schools and /admin/impersonate/:slug stay at root
      // (superadmin-only, tenant-agnostic) — no redirect.

      { source: '/og/:path*',                    destination: '/s/sage/og/:path*',            permanent: true },
    ]
  },
};

export default nextConfig;

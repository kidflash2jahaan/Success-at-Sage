import type { NextConfig } from "next";

// If `PRIMARY_DOMAIN` is set to the current brand-owned domain (e.g. the
// platform moves off successatsage.com), 301 any request hitting the old
// domain over to the new one so inbound links keep working. Leaving the
// env var unset is the safe default.
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

    // Legacy flat URLs → Sage tenant-scoped URLs. Permanent 301s so old
    // bookmarks, QR codes, and printed posters keep resolving. The slug
    // is hardcoded to `sage` because these paths only ever served Sage
    // before the multi-tenant restructure.
    //
    // `/admin/schools` and `/admin/users` are NOT listed — they are
    // superadmin-only, tenant-agnostic routes that live at the root.
    return [
      ...hostRedirects,
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
      { source: '/admin',                        destination: '/s/sage/admin',                permanent: true },
      { source: '/admin/contest',                destination: '/s/sage/admin/contest',        permanent: true },
      { source: '/admin/courses',                destination: '/s/sage/admin/courses',        permanent: true },
      { source: '/admin/submissions',            destination: '/s/sage/admin/submissions',    permanent: true },
      { source: '/admin/users/:id',              destination: '/s/sage/admin/users/:id',      permanent: true },
      { source: '/og/:path*',                    destination: '/s/sage/og/:path*',            permanent: true },
    ]
  },
};

export default nextConfig;

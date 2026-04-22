import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Phase 3: old flat paths → Sage tenant-scoped paths. Permanent
      // 301s preserve inbound links, QR codes, printed posters. Sage's
      // slug is hardcoded since it's the flagship and these old paths
      // only ever served Sage.
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
      { source: '/admin/:path*',                 destination: '/s/sage/admin/:path*',         permanent: true },
      { source: '/og/:path*',                    destination: '/s/sage/og/:path*',            permanent: true },
    ]
  },
};

export default nextConfig;

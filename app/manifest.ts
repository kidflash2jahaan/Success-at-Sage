import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Success at HS',
    short_name: 'Success at HS',
    description: 'Study notes and practice tests, built by high schoolers, for their own high school.',
    start_url: '/',
    display: 'standalone',
    background_color: '#06060f',
    theme_color: '#06060f',
    orientation: 'portrait',
    icons: [
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon', sizes: '192x192', type: 'image/png' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

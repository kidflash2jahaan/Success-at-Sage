// Brand constants for Satori-rendered marketing assets.
// Mirrors app/globals.css and marketing/src/_shared.css.

export const brand = {
  bg: '#06060f',
  bg2: '#0a0a1f',
  violet600: '#7c3aed',
  violet500: '#8b5cf6',
  violet400: '#a78bfa',
  violet300: '#c4b5fd',
  blue400: '#60a5fa',
  green400: '#34d399',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  text: '#ffffff',
  textDim: 'rgba(255, 255, 255, 0.55)',
  textFaint: 'rgba(255, 255, 255, 0.28)',
  glassBg: 'rgba(8, 10, 30, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
} as const

// Background: brand gradient + radial glow overlays.
// Satori supports multi-stop backgrounds, but not `mask-image`, so the
// grid shimmer from our HTML source is omitted — we get a cleaner,
// flatter look that still reads as the same brand.
export const bgLight =
  'radial-gradient(circle at 30% 20%, rgba(167, 139, 250, 0.40), transparent 55%),' +
  'radial-gradient(circle at 75% 80%, rgba(52, 211, 153, 0.22), transparent 55%),' +
  'radial-gradient(circle at 85% 25%, rgba(96, 165, 250, 0.28), transparent 50%),' +
  'linear-gradient(135deg, #0a0a1f 0%, #06060f 100%)'

export const bgDark =
  'radial-gradient(circle at 20% 15%, rgba(167, 139, 250, 0.32), transparent 55%),' +
  'radial-gradient(circle at 85% 85%, rgba(52, 211, 153, 0.22), transparent 55%),' +
  'radial-gradient(circle at 85% 15%, rgba(96, 165, 250, 0.24), transparent 55%),' +
  'linear-gradient(135deg, #0a0a1f 0%, #06060f 100%)'

// Brand gradient used for "at Sage" wordmark text.
// Satori can't background-clip text onto gradients reliably; we work around
// this by using `color: 'transparent'` + `backgroundImage` + `backgroundClip:
// 'text'` which IS supported.
export const gradientText = {
  backgroundImage: `linear-gradient(135deg, ${brand.violet400} 0%, ${brand.blue400} 50%, ${brand.green400} 100%)`,
  backgroundClip: 'text' as const,
  color: 'transparent',
}

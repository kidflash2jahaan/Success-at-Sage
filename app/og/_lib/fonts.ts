// Loads the Outfit TTFs bundled in app/og/_lib/fonts/ for ImageResponse.
// TTFs live on disk (not fetched at runtime) so rendering is reliable
// even if the build is offline or Google Fonts is blocked.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'app', 'og', '_lib', 'fonts')

let cached: Array<{ name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style: 'normal' }> | null = null

export async function loadFonts() {
  if (cached) return cached
  const [regular, bold, black] = await Promise.all([
    readFile(join(DIR, 'Outfit-Regular.ttf')),
    readFile(join(DIR, 'Outfit-Bold.ttf')),
    readFile(join(DIR, 'Outfit-Black.ttf')),
  ])
  cached = [
    { name: 'Outfit', data: regular.buffer as ArrayBuffer, weight: 400, style: 'normal' },
    { name: 'Outfit', data: bold.buffer as ArrayBuffer, weight: 700, style: 'normal' },
    { name: 'Outfit', data: black.buffer as ArrayBuffer, weight: 900, style: 'normal' },
  ]
  return cached
}

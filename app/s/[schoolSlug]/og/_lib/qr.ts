// Loads the bundled QR code (public/brand/qr.png) as a data URL so it
// can be embedded directly in Satori <img> elements without needing a
// resolvable HTTP URL.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

let cached: string | null = null

export async function qrDataUrl(): Promise<string> {
  if (cached) return cached
  const buf = await readFile(join(process.cwd(), 'public', 'brand', 'qr.png'))
  cached = `data:image/png;base64,${buf.toString('base64')}`
  return cached
}

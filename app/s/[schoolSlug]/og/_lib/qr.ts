// Generate a QR-code data URL pointing at a given URL. Rendered server-side
// so the image embeds directly into Satori's <img> via data: URI — no
// runtime fetch.
//
// Cached per input string within the process. QR for a given URL is
// deterministic and tenant slugs are stable, so the cache never needs
// invalidation; memory is bounded by the number of distinct hub URLs
// (one per tenant).
import QRCode from 'qrcode'

const cache = new Map<string, string>()

export async function qrDataUrl(text: string): Promise<string> {
  const hit = cache.get(text)
  if (hit) return hit
  const url = await QRCode.toDataURL(text, {
    width: 400,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
  cache.set(text, url)
  return url
}

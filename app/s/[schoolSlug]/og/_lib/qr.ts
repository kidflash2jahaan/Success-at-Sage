// Generate a QR-code data URL pointing at a given URL. Rendered server-side
// so the image embeds directly into Satori's <img> via data: URI — no
// runtime fetch.
import QRCode from 'qrcode'

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

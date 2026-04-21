// Bathroom stall poster — letter portrait (816×1056 @ 96 dpi = 8.5×11")
// Designed to be read in ~10 seconds while seated. Big prize amount,
// clear CTA, QR code prominent.
import { ImageResponse } from 'next/og'
import { brand, bgLight, gradientText } from '../_lib/brand'
import { loadFonts } from '../_lib/fonts'
import { getContestSettings, parsePrize, formatShortDate, daysUntil } from '../_lib/data'
import { qrDataUrl } from '../_lib/qr'
import { requireAdminResponse, responseHeaders } from '../_lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const [fonts, settings, qr] = await Promise.all([loadFonts(), getContestSettings(), qrDataUrl()])
  const prize = parsePrize(settings.prize_description)
  const daysLeft = daysUntil(settings.next_reset_date)

  return new ImageResponse(
    (
      <div
        style={{
          width: 816,
          height: 1056,
          display: 'flex',
          flexDirection: 'column',
          padding: 64,
          background: bgLight,
          fontFamily: 'Outfit',
          color: brand.text,
          position: 'relative',
        }}
      >
        {/* Corner crosshairs */}
        <div style={{ position: 'absolute', top: 36, left: 36, width: 44, height: 44, borderTop: `2px solid ${brand.glassBorder}`, borderLeft: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', top: 36, right: 36, width: 44, height: 44, borderTop: `2px solid ${brand.glassBorder}`, borderRight: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', bottom: 36, left: 36, width: 44, height: 44, borderBottom: `2px solid ${brand.glassBorder}`, borderLeft: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', bottom: 36, right: 36, width: 44, height: 44, borderBottom: `2px solid ${brand.glassBorder}`, borderRight: `2px solid ${brand.glassBorder}` }} />

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 2, background: brand.amber400 }} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: brand.amber400 }}>
            Sage Hill · Study Contest
          </span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 56, fontWeight: 800, color: brand.text, marginTop: 32, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          Win
        </div>

        {/* Prize hero */}
        <div
          style={{
            fontSize: 260,
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: '-0.05em',
            marginTop: 4,
            ...gradientText,
          }}
        >
          {prize.amount}
        </div>

        {prize.label && (
          <div style={{ fontSize: 30, fontWeight: 600, color: brand.text, marginTop: 12, letterSpacing: '-0.01em' }}>
            {prize.label}
          </div>
        )}

        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: brand.textDim,
            marginTop: 24,
            lineHeight: 1.3,
            maxWidth: 560,
          }}
        >
          for the top note-uploader this month. Admin-approved. Free forever.
        </div>

        {/* QR + info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 'auto', paddingTop: 32 }}>
          <div
            style={{
              display: 'flex',
              background: '#ffffff',
              padding: 16,
              borderRadius: 20,
            }}
          >
            {/* Satori requires width/height on <img>; next/image doesn't run inside ImageResponse */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={200} height={200} alt="" style={{ display: 'flex' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <div style={{ fontSize: 22, color: brand.textFaint, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
              Scan to upload
            </div>
            <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, marginTop: 8, letterSpacing: '-0.01em' }}>
              <span style={{ color: brand.text }}>successatsage</span>
              <span style={{ color: brand.amber400 }}>.com</span>
            </div>
            <div style={{ fontSize: 22, color: brand.textDim, marginTop: 14, fontWeight: 500 }}>
              AP review notes · finals guides · practice tests
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: `1px solid ${brand.glassBorder}`,
            marginTop: 32,
          }}
        >
          <div style={{ fontSize: 20, color: brand.textDim, fontWeight: 600 }}>
            {settings.next_reset_date ? `Deadline ${formatShortDate(settings.next_reset_date)}` : 'Monthly contest'}
            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 31 && (
              <span style={{ color: brand.amber400, marginLeft: 12 }}>
                {daysLeft === 0 ? '· today' : `· ${daysLeft}d left`}
              </span>
            )}
          </div>
          <div style={{ fontSize: 20, color: brand.textFaint, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Student-built · Admin-approved
          </div>
        </div>
      </div>
    ),
    { width: 816, height: 1056, fonts, headers: responseHeaders(request, 'poster-stall.png') },
  )
}

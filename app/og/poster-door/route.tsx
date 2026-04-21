// Classroom door poster — letter landscape (1056×816 @ 96 dpi = 11×8.5")
// Designed to be glanceable from across a hallway. Prize + QR dominate.
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
          width: 1056,
          height: 816,
          display: 'flex',
          padding: 56,
          background: bgLight,
          fontFamily: 'Outfit',
          color: brand.text,
          position: 'relative',
        }}
      >
        {/* Corner crosshairs */}
        <div style={{ position: 'absolute', top: 28, left: 28, width: 44, height: 44, borderTop: `2px solid ${brand.glassBorder}`, borderLeft: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', top: 28, right: 28, width: 44, height: 44, borderTop: `2px solid ${brand.glassBorder}`, borderRight: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', bottom: 28, left: 28, width: 44, height: 44, borderBottom: `2px solid ${brand.glassBorder}`, borderLeft: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', bottom: 28, right: 28, width: 44, height: 44, borderBottom: `2px solid ${brand.glassBorder}`, borderRight: `2px solid ${brand.glassBorder}` }} />

        {/* Left: copy stack */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingRight: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 36, height: 2, background: brand.amber400 }} />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: brand.amber400 }}>
              Sage Hill Study Contest
            </span>
          </div>

          <div style={{ fontSize: 50, fontWeight: 800, color: brand.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
            Upload notes. Win
          </div>

          <div
            style={{
              fontSize: 240,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              marginTop: 6,
              ...gradientText,
            }}
          >
            {prize.amount}
          </div>

          {prize.label && (
            <div style={{ fontSize: 26, fontWeight: 600, color: brand.text, marginTop: 10, letterSpacing: '-0.01em' }}>
              {prize.label}
            </div>
          )}

          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: brand.textDim,
              marginTop: 24,
              lineHeight: 1.3,
              maxWidth: 520,
            }}
          >
            Top note-uploader this month wins. Admin-approved. Free for every Sage Hill student.
          </div>
        </div>

        {/* Right: QR block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 360,
          }}
        >
          <div
            style={{
              display: 'flex',
              background: '#ffffff',
              padding: 20,
              borderRadius: 24,
            }}
          >
            {/* Satori requires width/height on <img>; next/image doesn't run inside ImageResponse */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={300} height={300} alt="" style={{ display: 'flex' }} />
          </div>
          <div style={{ fontSize: 20, color: brand.textFaint, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', marginTop: 22 }}>
            Scan to upload
          </div>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 800, marginTop: 10, letterSpacing: '-0.01em' }}>
            <span style={{ color: brand.text }}>successatsage</span>
            <span style={{ color: brand.amber400 }}>.com</span>
          </div>
          {settings.next_reset_date && (
            <div style={{ fontSize: 20, color: brand.textDim, marginTop: 18, fontWeight: 600 }}>
              Deadline {formatShortDate(settings.next_reset_date)}
              {daysLeft !== null && daysLeft >= 0 && daysLeft <= 31 && (
                <span style={{ color: brand.amber400 }}>
                  {' '}· {daysLeft === 0 ? 'today' : `${daysLeft}d left`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1056, height: 816, fonts, headers: responseHeaders(request, 'poster-door.png') },
  )
}

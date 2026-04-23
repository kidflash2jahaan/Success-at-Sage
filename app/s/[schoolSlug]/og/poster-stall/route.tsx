// Poster — letter portrait (816×1056 @ 96 dpi = 8.5×11"). Centered,
// concert-poster layout. QR encodes the tenant's subdomain so scanning
// drops the reader directly onto the school's own hub.
import { ImageResponse } from 'next/og'
import { brand, bgLight, gradientText } from '../_lib/brand'
import { loadFonts } from '../_lib/fonts'
import { getContestSettings, parsePrize, formatShortDate, daysUntil } from '../_lib/data'
import { qrDataUrl } from '../_lib/qr'
import { requireAdminResponse, responseHeaders } from '../_lib/auth'
import { resolveTenantBySlug } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ schoolSlug: string }> }) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const hubUrl = `https://${schoolSlug}.successaths.com`
  const [fonts, settings, qr] = await Promise.all([
    loadFonts(),
    getContestSettings(tenant.id),
    qrDataUrl(hubUrl),
  ])
  const prize = parsePrize(settings.prize_description)
  const daysLeft = daysUntil(settings.next_reset_date)
  const prizeEnabled = tenant.prizeEnabled

  return new ImageResponse(
    (
      <div
        style={{
          width: 816,
          height: 1056,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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

        {/* Eyebrow — centered with amber accents on both sides */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 2, background: `linear-gradient(90deg, transparent, ${brand.amber400})` }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: brand.amber400 }}>
            {tenant.displayShort} · {prizeEnabled ? 'Study Contest' : 'Study Notes'}
          </span>
          <div style={{ width: 36, height: 2, background: `linear-gradient(90deg, ${brand.amber400}, transparent)` }} />
        </div>

        {/* Hero — prize amount when enabled, school wordmark when disabled */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexGrow: 1,
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {prizeEnabled ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: brand.textDim, letterSpacing: '-0.01em' }}>
                Win
              </div>
              <div
                style={{
                  fontSize: 220,
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: '-0.05em',
                  marginTop: 8,
                  paddingBottom: '0.08em',
                  ...gradientText,
                }}
              >
                {prize.amount}
              </div>
              {prize.label && (
                <div style={{ fontSize: 28, fontWeight: 600, color: brand.text, marginTop: 12, letterSpacing: '-0.01em' }}>
                  {prize.label}
                </div>
              )}
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  color: brand.textDim,
                  marginTop: 22,
                  lineHeight: 1.35,
                  maxWidth: 560,
                  textAlign: 'center',
                }}
              >
                for the top note-uploader this month. Admin-approved. Free forever.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15 }}>
              <div style={{ fontSize: 130, fontWeight: 800, letterSpacing: '-0.04em', color: brand.text }}>
                Success
              </div>
              <div
                style={{
                  fontSize: 130,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  paddingBottom: '0.14em',
                  ...gradientText,
                }}
              >
                {`at ${tenant.displayShort}`}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  color: brand.textDim,
                  marginTop: 20,
                  lineHeight: 1.35,
                  maxWidth: 560,
                  textAlign: 'center',
                }}
              >
                Student-built study notes. Admin-approved. Free forever.
              </div>
            </div>
          )}
        </div>

        {/* QR block — centered, stacked with URL below */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 18, color: brand.textFaint, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 14 }}>
            Scan to upload
          </div>
          <div
            style={{
              display: 'flex',
              background: '#ffffff',
              padding: 14,
              borderRadius: 18,
            }}
          >
            {/* Satori requires width/height on <img>; next/image doesn't run inside ImageResponse */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={196} height={196} alt="" style={{ display: 'flex' }} />
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, marginTop: 18, letterSpacing: '-0.01em' }}>
            <span style={{ color: brand.text }}>{schoolSlug}.successaths</span>
            <span style={{ color: brand.amber400 }}>.com</span>
          </div>
        </div>

        {/* Footer — centered one-line strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            width: '100%',
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${brand.glassBorder}`,
          }}
        >
          <span style={{ fontSize: 18, color: brand.textDim, fontWeight: 600 }}>
            {settings.next_reset_date ? `Deadline ${formatShortDate(settings.next_reset_date)}` : 'Monthly reset'}
          </span>
          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 31 && (
            <>
              <span style={{ color: brand.textFaint }}>·</span>
              <span style={{ fontSize: 18, color: brand.amber400, fontWeight: 700 }}>
                {daysLeft === 0 ? 'today' : `${daysLeft}d left`}
              </span>
            </>
          )}
          <span style={{ color: brand.textFaint }}>·</span>
          <span style={{ fontSize: 16, color: brand.textFaint, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Student-built
          </span>
        </div>
      </div>
    ),
    { width: 816, height: 1056, fonts, headers: responseHeaders(request, 'poster-stall.png') },
  )
}

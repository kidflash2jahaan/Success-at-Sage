// Monthly announcement — Instagram feed post (1080×1080)
// Paired copy lives in marketing/copy/README.md § "Launch post".
import { ImageResponse } from 'next/og'
import { brand, bgLight, gradientText } from '../_lib/brand'
import { loadFonts } from '../_lib/fonts'
import { getContestSettings, parsePrize, formatShortDate, daysUntil } from '../_lib/data'
import { requireAdminResponse, responseHeaders } from '../_lib/auth'
import { resolveTenantBySlug } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ schoolSlug: string }> }) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const [fonts, settings] = await Promise.all([loadFonts(), getContestSettings(tenant.id)])
  const prize = parsePrize(settings.prize_description)
  const deadline = settings.next_reset_date
  const daysLeft = daysUntil(deadline)
  const prizeEnabled = tenant.prizeEnabled

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          padding: 96,
          background: bgLight,
          fontFamily: 'Outfit',
          color: brand.text,
          position: 'relative',
        }}
      >
        {/* Corner crosshairs */}
        <div style={{ position: 'absolute', top: 56, left: 56, width: 60, height: 60, borderTop: `2px solid ${brand.glassBorder}`, borderLeft: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', top: 56, right: 56, width: 60, height: 60, borderTop: `2px solid ${brand.glassBorder}`, borderRight: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', bottom: 56, left: 56, width: 60, height: 60, borderBottom: `2px solid ${brand.glassBorder}`, borderLeft: `2px solid ${brand.glassBorder}` }} />
        <div style={{ position: 'absolute', bottom: 56, right: 56, width: 60, height: 60, borderBottom: `2px solid ${brand.glassBorder}`, borderRight: `2px solid ${brand.glassBorder}` }} />

        {/* Top eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            color: brand.amber400,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 50, height: 2, background: `linear-gradient(90deg, transparent, ${brand.amber400})` }} />
          <span>New · On Campus</span>
          <div style={{ width: 50, height: 2, background: `linear-gradient(90deg, ${brand.amber400}, transparent)` }} />
        </div>

        {/* Hero block — prize amount when enabled, wordmark when disabled */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', alignItems: prizeEnabled ? 'flex-start' : 'center', marginTop: 20 }}>
          {prizeEnabled ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: brand.textDim,
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  marginBottom: 20,
                }}
              >
                Win
              </div>
              <div
                style={{
                  fontSize: 380,
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: '-0.05em',
                  ...gradientText,
                }}
              >
                {prize.amount}
              </div>
              {prize.label && (
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 600,
                    color: brand.text,
                    marginTop: 18,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {prize.label}
                </div>
              )}
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 500,
                  color: brand.textDim,
                  marginTop: 40,
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}
              >
                for the top note-uploader this month.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
              <div
                style={{
                  fontSize: 180,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: brand.text,
                }}
              >
                Success
              </div>
              <div
                style={{
                  fontSize: 180,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  paddingBottom: '0.12em',
                  ...gradientText,
                }}
              >
                {`at ${tenant.displayShort}`}
              </div>
            </div>
          )}
        </div>

        {/* Info strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 32,
            borderTop: `1px solid ${brand.glassBorder}`,
            marginTop: 32,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, color: brand.textFaint, textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600 }}>
              Deadline
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 6 }}>
              <span style={{ fontSize: 40, color: brand.text, fontWeight: 700 }}>
                {deadline ? formatShortDate(deadline) : 'Month end'}
              </span>
              {daysLeft !== null && daysLeft >= 0 && (
                <span style={{ color: brand.amber400, marginLeft: 14, fontSize: 28, fontWeight: 700 }}>
                  {daysLeft === 0 ? 'today' : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 22, color: brand.textFaint, textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600 }}>
              Link in bio
            </div>
            <div style={{ fontSize: 40, color: brand.text, fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center' }}>
              <span style={{ color: brand.text }}>{schoolSlug}.successaths</span>
              <span style={{ color: brand.amber400 }}>.com</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts, headers: responseHeaders(request, 'ig-monthly-announcement.png') },
  )
}

// Winner reveal — Instagram feed post (1080×1080)
// Pulls the most recently *paid* winner from the DB. If no paid winner
// exists yet, falls back to the current period's leader (as a preview).
import { ImageResponse } from 'next/og'
import { brand, bgLight, gradientText } from '../_lib/brand'
import { loadFonts } from '../_lib/fonts'
import { getContestSettings, getLatestPaidWinner, getLeaders, parsePrize, formatPeriod } from '../_lib/data'
import { requireAdminResponse, responseHeaders } from '../_lib/auth'
import { resolveTenantBySlug } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ schoolSlug: string }> }) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const [fonts, settings, paidWinner] = await Promise.all([
    loadFonts(),
    getContestSettings(tenant.id),
    getLatestPaidWinner(tenant.id),
  ])
  const prize = parsePrize(settings.prize_description)

  let displayName = 'Winner'
  let displayPeriod = formatPeriod(settings.period_start)
  let submissions = 0
  let views = 0
  let isPreview = false

  if (paidWinner && paidWinner.users) {
    displayName = paidWinner.users.full_name
    displayPeriod = paidWinner.period_label
    // Aggregate stats for winner during their period (best-effort via leaders table)
    // For now, the winners table doesn't store counts — pull current leader as best approximation
    const leaders = await getLeaders(settings)
    const match = leaders.find(l => l.full_name === displayName)
    if (match) {
      submissions = match.submission_count
      views = match.total_views
    }
  } else {
    // No paid winner yet — fall back to current leader as a preview
    const leaders = await getLeaders(settings)
    const leader = leaders[0]
    if (leader) {
      displayName = leader.full_name
      submissions = leader.submission_count
      views = leader.total_views
      isPreview = true
    }
  }

  const firstName = displayName.split(' ')[0] || displayName

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          background: bgLight,
          fontFamily: 'Outfit',
          color: brand.text,
          position: 'relative',
        }}
      >
        {/* Confetti-ish corner dots */}
        <div style={{ position: 'absolute', top: 100, right: 120, width: 12, height: 12, borderRadius: 6, background: brand.amber400 }} />
        <div style={{ position: 'absolute', top: 170, right: 80, width: 8, height: 8, borderRadius: 4, background: brand.violet400 }} />
        <div style={{ position: 'absolute', top: 240, right: 180, width: 10, height: 10, borderRadius: 5, background: brand.green400 }} />
        <div style={{ position: 'absolute', bottom: 240, left: 90, width: 12, height: 12, borderRadius: 6, background: brand.blue400 }} />
        <div style={{ position: 'absolute', bottom: 320, left: 150, width: 8, height: 8, borderRadius: 4, background: brand.amber400 }} />

        {/* Top ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{ width: 80, height: 2, background: brand.amber400 }} />
          <span
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: brand.amber400,
            }}
          >
            {isPreview ? 'Leading' : 'Winner'}
          </span>
          <div style={{ width: 80, height: 2, background: brand.amber400 }} />
        </div>

        <div
          style={{
            fontSize: 28,
            color: brand.textDim,
            textAlign: 'center',
            letterSpacing: '0.16em',
            marginTop: 16,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {displayPeriod}
        </div>

        {/* Name hero */}
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 220,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              textAlign: 'center',
              ...gradientText,
            }}
          >
            {firstName}
          </div>
          {displayName !== firstName && (
            <div
              style={{
                fontSize: 44,
                fontWeight: 500,
                color: brand.textDim,
                marginTop: 20,
                letterSpacing: '-0.01em',
              }}
            >
              {displayName}
            </div>
          )}
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: brand.text,
              marginTop: 36,
              textAlign: 'center',
              lineHeight: 1.25,
            }}
          >
            {isPreview ? `leading for ${prize.amount}` : `took home ${prize.amount}`}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            padding: '28px 0',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 68, fontWeight: 900, color: brand.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {submissions}
            </span>
            <span style={{ fontSize: 22, color: brand.textFaint, textTransform: 'uppercase', letterSpacing: '0.24em', marginTop: 10, fontWeight: 600 }}>
              uploads
            </span>
          </div>
          <div style={{ width: 1, background: brand.glassBorder }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 68, fontWeight: 900, color: brand.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {views.toLocaleString()}
            </span>
            <span style={{ fontSize: 22, color: brand.textFaint, textTransform: 'uppercase', letterSpacing: '0.24em', marginTop: 10, fontWeight: 600 }}>
              views earned
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 24,
            borderTop: `1px solid ${brand.glassBorder}`,
          }}
        >
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>
            <span style={{ color: brand.text }}>{schoolSlug}.successaths</span>
            <span style={{ color: brand.amber400 }}>.com</span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts, headers: responseHeaders(request, 'ig-winner.png') },
  )
}

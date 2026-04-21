// Leaderboard update — Instagram feed post (1080×1080)
// Shows the top 3 contributors for the current contest period, with their
// submission counts and total views. Re-generated from live DB state each
// time the admin clicks "Generate" in /admin/contest.
import { ImageResponse } from 'next/og'
import { brand, bgLight, gradientText } from '../_lib/brand'
import { loadFonts } from '../_lib/fonts'
import { getContestSettings, getLeaders, parsePrize, formatPeriod, formatShortDate, daysUntil } from '../_lib/data'
import { requireAdminResponse, responseHeaders } from '../_lib/auth'

export const dynamic = 'force-dynamic'

const RANK_COLORS = [brand.amber400, brand.violet400, brand.green400]

export async function GET(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const [fonts, settings] = await Promise.all([loadFonts(), getContestSettings()])
  const leaders = (await getLeaders(settings)).slice(0, 3)
  const prize = parsePrize(settings.prize_description)
  const period = formatPeriod(settings.period_start)
  const daysLeft = daysUntil(settings.next_reset_date)

  // Pad with empty slots if fewer than 3 leaders exist
  const slots: Array<{ full_name: string; submission_count: number; total_views: number } | null> = [
    leaders[0] ?? null,
    leaders[1] ?? null,
    leaders[2] ?? null,
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          padding: 72,
          background: bgLight,
          fontFamily: 'Outfit',
          color: brand.text,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: brand.amber400,
            }}
          >
            Leaderboard
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginTop: 12,
              lineHeight: 1,
              ...gradientText,
            }}
          >
            {period}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: brand.textDim,
              marginTop: 18,
            }}
          >
            {prize.amount} {prize.label || 'prize'} for #1 on {settings.next_reset_date ? formatShortDate(settings.next_reset_date) : 'month end'}
          </div>
        </div>

        {/* Top 3 stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 56, flexGrow: 1 }}>
          {slots.map((leader, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '32px 40px',
                borderRadius: 28,
                background: brand.glassBg,
                border: `1px solid ${brand.glassBorder}`,
                opacity: leader ? 1 : 0.45,
              }}
            >
              {/* Rank badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 100,
                  height: 100,
                  borderRadius: 24,
                  fontSize: 64,
                  fontWeight: 900,
                  color: RANK_COLORS[i],
                  background: `rgba(${i === 0 ? '251, 191, 36' : i === 1 ? '167, 139, 250' : '52, 211, 153'}, 0.12)`,
                  border: `2px solid ${RANK_COLORS[i]}`,
                  letterSpacing: '-0.02em',
                }}
              >
                {i + 1}
              </div>
              {/* Name + stats */}
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 32, flexGrow: 1 }}>
                <div style={{ fontSize: 46, fontWeight: 700, color: brand.text, letterSpacing: '-0.01em' }}>
                  {leader?.full_name ?? 'Empty — claim it'}
                </div>
                {leader ? (
                  <div style={{ display: 'flex', fontSize: 24, color: brand.textDim, marginTop: 6, gap: 18 }}>
                    <span>{leader.submission_count} {leader.submission_count === 1 ? 'upload' : 'uploads'}</span>
                    <span style={{ color: brand.textFaint }}>·</span>
                    <span>{leader.total_views.toLocaleString()} views</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 24, color: brand.textFaint, marginTop: 6 }}>
                    upload 1 thing = instant top 3
                  </div>
                )}
              </div>
              {/* Upload count big */}
              {leader && (
                <div style={{ display: 'flex', alignItems: 'baseline', marginLeft: 16 }}>
                  <span style={{ fontSize: 72, fontWeight: 900, color: brand.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {leader.submission_count}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: `1px solid ${brand.glassBorder}`,
            marginTop: 28,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 600, color: brand.textDim }}>
            {daysLeft !== null && daysLeft >= 0
              ? daysLeft === 0
                ? 'Last day to upload'
                : `${daysLeft} days left to upload`
              : 'Upload now to claim a spot'}
          </div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 700 }}>
            <span style={{ color: brand.text }}>successatsage</span>
            <span style={{ color: brand.amber400 }}>.com</span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts, headers: responseHeaders(request, 'ig-leaderboard.png') },
  )
}

// Profile picture — square wordmark (1080×1080) for Instagram avatar.
// Per-tenant: renders "Success at {school.displayShort}" instead of a
// hardcoded Sage version. Mirrors marketing/src/profile-picture.html.
import { ImageResponse } from 'next/og'
import { brand, bgLight, gradientText } from '../_lib/brand'
import { loadFonts } from '../_lib/fonts'
import { requireAdminResponse, responseHeaders } from '../_lib/auth'
import { resolveTenantBySlug } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ schoolSlug: string }> }) {
  const denied = await requireAdminResponse()
  if (denied) return denied

  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const fonts = await loadFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 80px',
            lineHeight: 1.2,
          }}
        >
          <div
            style={{
              fontSize: 220,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: brand.text,
            }}
          >
            Success
          </div>
          <div
            style={{
              fontSize: 220,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              paddingBottom: '0.12em',
              ...gradientText,
            }}
          >
            {`at ${tenant.displayShort}`}
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts, headers: responseHeaders(request, 'profile-picture.png') },
  )
}

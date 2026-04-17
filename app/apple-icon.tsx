import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: 'linear-gradient(135deg, #0d0f24 0%, #06060f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: '#7c3aed',
            lineHeight: 1,
            letterSpacing: '-0.05em',
          }}
        >
          S
        </div>
      </div>
    ),
    { ...size }
  )
}

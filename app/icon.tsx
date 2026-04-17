import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: 'linear-gradient(135deg, #0d0f24 0%, #06060f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 96,
        }}
      >
        <div
          style={{
            fontSize: 280,
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

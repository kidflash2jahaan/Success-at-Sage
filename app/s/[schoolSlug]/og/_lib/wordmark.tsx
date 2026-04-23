import { brand, gradientText } from './brand'

// "Success / at <displayShort>" stacked wordmark shared across the
// profile-picture, poster-stall (prize-off), and ig-monthly-announcement
// (prize-off) OG routes.
//
// `descenderPad` is the bottom padding on the gradient line — without it,
// the "g" in most display names gets its descender clipped by Satori's
// background-clip: text bounding box.
export function Wordmark({
  displayShort,
  size,
  lineHeight = 1.2,
  descenderPad = '0.12em',
}: {
  displayShort: string
  size: number
  lineHeight?: number
  descenderPad?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight }}>
      <div style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.04em', color: brand.text }}>
        Success
      </div>
      <div
        style={{
          fontSize: size,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          paddingBottom: descenderPad,
          ...gradientText,
        }}
      >
        {`at ${displayShort}`}
      </div>
    </div>
  )
}

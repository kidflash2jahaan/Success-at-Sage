export default function BlobBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Blue — top-left */}
      <div style={{
        position: 'absolute',
        width: 700, height: 700,
        top: -200, left: -180,
        background: 'radial-gradient(circle at 40% 40%, rgba(37,99,235,0.4) 0%, transparent 65%)',
        filter: 'blur(80px)',
        willChange: 'transform, opacity',
        animation: 'blob-1 18s ease-in-out infinite',
      }} />
      {/* Violet — top-right */}
      <div style={{
        position: 'absolute',
        width: 620, height: 620,
        top: -120, right: -160,
        background: 'radial-gradient(circle at 60% 40%, rgba(124,58,237,0.38) 0%, transparent 65%)',
        filter: 'blur(80px)',
        willChange: 'transform, opacity',
        animation: 'blob-2 22s ease-in-out infinite',
      }} />
      {/* Teal — bottom-center */}
      <div style={{
        position: 'absolute',
        width: 520, height: 520,
        bottom: -120, left: '30%',
        background: 'radial-gradient(circle at 50% 60%, rgba(13,148,136,0.32) 0%, transparent 65%)',
        filter: 'blur(80px)',
        willChange: 'transform, opacity',
        animation: 'blob-3 16s ease-in-out infinite',
      }} />
      {/* Rose — bottom-right */}
      <div style={{
        position: 'absolute',
        width: 380, height: 380,
        bottom: '18%', right: -80,
        background: 'radial-gradient(circle at 55% 45%, rgba(219,39,119,0.28) 0%, transparent 65%)',
        filter: 'blur(80px)',
        willChange: 'transform, opacity',
        animation: 'blob-4 26s ease-in-out infinite',
      }} />
    </div>
  )
}

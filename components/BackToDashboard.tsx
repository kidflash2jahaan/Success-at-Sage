import Link from 'next/link'

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors mb-6"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Dashboard
    </Link>
  )
}

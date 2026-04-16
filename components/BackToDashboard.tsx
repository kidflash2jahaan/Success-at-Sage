import Link from 'next/link'

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors mb-6"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Dashboard
    </Link>
  )
}

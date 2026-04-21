import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-scale-in w-full max-w-md text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.3))' }}
        >
          <svg className="w-7 h-7 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300/70 mb-3">
          Error 404
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          The page you&rsquo;re looking for doesn&rsquo;t exist, or may have been moved.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="btn-press font-semibold text-white bg-violet-600 hover:bg-violet-500 px-6 py-2.5 rounded-xl text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="btn-press font-semibold text-white/70 hover:text-white glass px-6 py-2.5 rounded-xl text-sm transition-all hover:bg-white/[0.07]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}

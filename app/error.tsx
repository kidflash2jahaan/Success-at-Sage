'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log client-side so we at least see it in browser devtools; Next.js also
    // captures the server-side error with a digest that the team can look up.
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-scale-in w-full max-w-md text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.25), rgba(251,146,60,0.25))' }}
        >
          <svg className="w-7 h-7 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 3a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300/70 mb-3">
          Something broke
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
          That didn&rsquo;t work
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-2">
          Something went wrong on our end. We&rsquo;ve been notified — please try again.
        </p>
        {error.digest && (
          <p className="text-white/25 text-xs font-mono mb-8 mt-3">
            Reference: {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-8" />}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => reset()}
            className="btn-press font-semibold text-white bg-violet-600 hover:bg-violet-500 px-6 py-2.5 rounded-xl text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="btn-press font-semibold text-white/70 hover:text-white glass px-6 py-2.5 rounded-xl text-sm transition-all hover:bg-white/[0.07]"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

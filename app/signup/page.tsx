'use client'
import { signUpWithEmail } from '@/app/actions/signup'
import { getGraduatingYearOptions } from '@/lib/grade'
import SubmitButton from '@/components/ui/SubmitButton'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ERRORS: Record<string, string> = {
  taken: 'An account with that email already exists.',
  domain: 'No school is set up for that email domain yet. Request your school to get added.',
}

function SignupForm() {
  const params = useSearchParams()
  const errorMessage = ERRORS[params.get('error') ?? '']
  const years = getGraduatingYearOptions()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-scale-in w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl glass mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.3))' }}
          >
            <svg className="w-6 h-6 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-white/40 text-sm mt-1">Join Success at HS</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200"
          >
            {errorMessage}
          </div>
        )}

        <div className="glass rounded-2xl p-7">
          <form action={signUpWithEmail} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input name="fullName" required placeholder="Your Name"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email</label>
              <input name="email" type="email" required placeholder="you@yourschool.org"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
              <input name="password" type="password" required placeholder="Min. 8 characters" minLength={8}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Graduating Year</label>
              <select name="graduatingYear" required className="glass-input w-full rounded-xl px-4 py-2.5 text-sm">
                {years.map(({ year, label }) => (
                  <option key={year} value={year}>{year} — {label}</option>
                ))}
              </select>
            </div>
            <SubmitButton
              pendingLabel="Creating account..."
              className="btn-press mt-2 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-70 disabled:cursor-wait text-white font-semibold rounded-xl py-2.5 text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
            >
              Create Account
            </SubmitButton>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

'use client'
import { signUpWithEmail } from '@/app/actions/signup'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignupForm() {
  const searchParams = useSearchParams()
  const sent = searchParams.get('sent')
  const currentYear = new Date().getFullYear()
  const years = [currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4]

  if (sent) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#16213e] border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-white/50 mb-8">We sent a verification link to your email address. Click it to confirm your account and sign in.</p>
          <Link href="/login" className="text-purple-400 hover:text-purple-300 text-sm">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16213e] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Create your account</h1>
        <form action={signUpWithEmail} className="flex flex-col gap-4">
          <input name="fullName" required placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <input name="email" type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <input name="password" type="password" required placeholder="Password" minLength={8} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <div>
            <label className="block text-sm text-white/70 mb-1">Graduating Year</label>
            <select name="graduatingYear" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="submit" className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg py-2.5 transition-colors">Create Account</button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account? <Link href="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
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

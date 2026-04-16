'use client'
import { signInWithEmail } from '@/app/actions/login'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16213e] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Sign in to Success at Sage</h1>
        <form action={signInWithEmail} className="flex flex-col gap-4">
          <input name="email" type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <input name="password" type="password" required placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg py-2.5 transition-colors">Sign In</button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          No account? <Link href="/signup" className="text-purple-400 hover:text-purple-300">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

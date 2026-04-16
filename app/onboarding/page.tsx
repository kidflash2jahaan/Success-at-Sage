import { completeOnboarding } from '@/app/actions/auth'
import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function OnboardingPage() {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  const [existing] = await db.select().from(users).where(eq(users.id, authUser.id))
  if (existing) redirect('/dashboard')

  const currentYear = new Date().getFullYear()
  const years = [currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4]

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16213e] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Success at Sage</h1>
        <p className="text-white/60 mb-8">Tell us a bit about yourself to get started.</p>
        <form action={completeOnboarding} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Full Name</label>
            <input
              name="fullName"
              required
              defaultValue={authUser.user_metadata?.full_name ?? ''}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Graduating Year</label>
            <select
              name="graduatingYear"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  )
}

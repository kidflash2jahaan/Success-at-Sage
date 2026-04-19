import { completeOnboarding } from '@/app/actions/auth'
import { getUser } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single()
  if (existing) redirect('/dashboard')

  const currentYear = new Date().getFullYear()
  const years = [currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-scale-in w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Success at Sage</h1>
          <p className="text-white/40 text-sm mt-1">Tell us a bit about yourself to get started.</p>
        </div>
        <div className="glass rounded-2xl p-8">
          <form action={completeOnboarding} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input
                name="fullName"
                required
                defaultValue={authUser.user_metadata?.full_name ?? ''}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Graduating Year</label>
              <select
                name="graduatingYear"
                required
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-press mt-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
            >
              Get Started
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

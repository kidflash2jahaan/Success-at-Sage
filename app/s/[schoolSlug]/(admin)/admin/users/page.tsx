export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { promoteToAdmin, demoteToStudent } from '@/app/actions/admin'
import { calculateGrade } from '@/lib/auth'
import { resolveTenantBySlug } from '@/lib/tenant'
import Link from 'next/link'
import SubmitButton from '@/components/ui/SubmitButton'

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)

  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('school_id', tenant.id)
    .order('created_at')
  const allUsers = (data ?? []).map((u: any) => ({
    id: u.id as string,
    email: u.email as string,
    fullName: u.full_name as string,
    graduatingYear: u.graduating_year as number,
    role: u.role as 'student' | 'admin',
  }))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Users</h1>
      <p className="text-white/40 text-sm mb-8">
        {allUsers.length} {allUsers.length === 1 ? 'user' : 'users'} in {tenant.displayShort}
      </p>
      <div className="flex flex-col gap-2 max-w-2xl">
        {allUsers.map(user => {
          const { label } = calculateGrade(user.graduatingYear)
          return (
            <div key={user.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <div>
                <div className="text-white font-medium">{user.fullName}</div>
                <div className="text-white/40 text-xs">{user.email} · {label} · Class of {user.graduatingYear}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  user.role === 'admin'
                    ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                    : 'border-white/10 text-white/40'
                }`}>{user.role}</span>
                <Link href={`/s/${schoolSlug}/admin/users/${user.id}`} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                  Edit
                </Link>
                {user.role === 'student' ? (
                  <form action={promoteToAdmin.bind(null, user.id)}>
                    <SubmitButton pendingLabel="..." className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-60 disabled:cursor-wait">Make Admin</SubmitButton>
                  </form>
                ) : (
                  <form action={demoteToStudent.bind(null, user.id)}>
                    <SubmitButton pendingLabel="..." className="text-xs text-white/30 hover:text-white/60 disabled:opacity-60 disabled:cursor-wait">Remove Admin</SubmitButton>
                  </form>
                )}
              </div>
            </div>
          )
        })}
        {allUsers.length === 0 && (
          <p className="text-white/30 text-sm">No users in this school yet.</p>
        )}
      </div>
    </div>
  )
}

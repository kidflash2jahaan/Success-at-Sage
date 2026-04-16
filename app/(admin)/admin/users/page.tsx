export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { promoteToAdmin, demoteToStudent } from '@/app/actions/admin'
import { calculateGrade } from '@/lib/auth'

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users).orderBy(users.createdAt)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Users ({allUsers.length})</h1>
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
                {user.role === 'student' ? (
                  <form action={promoteToAdmin.bind(null, user.id)}>
                    <button type="submit" className="text-xs text-purple-400 hover:text-purple-300">Make Admin</button>
                  </form>
                ) : (
                  <form action={demoteToStudent.bind(null, user.id)}>
                    <button type="submit" className="text-xs text-white/30 hover:text-white/60">Remove Admin</button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

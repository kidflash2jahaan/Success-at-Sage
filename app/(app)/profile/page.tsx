export const dynamic = 'force-dynamic'

import { requireUser, calculateGrade } from '@/lib/auth'
import { getUserSubmissions } from '@/lib/db/queries/materials'

export default async function ProfilePage() {
  const user = await requireUser()
  const { label } = calculateGrade(user.graduatingYear)
  const submissions = await getUserSubmissions(user.id)

  const statusColor: Record<string, string> = {
    approved: '#34d399',
    pending: '#fbbf24',
    rejected: '#f87171',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
        <p className="text-white/50 mt-1">{label} · Class of {user.graduatingYear}</p>
        <p className="text-white/40 text-sm mt-1">{user.email}</p>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">My Submissions ({submissions.length})</h2>
      {submissions.length === 0 ? (
        <p className="text-white/30">You haven&apos;t submitted anything yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map(s => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-medium">{s.title}</div>
                <div className="text-white/40 text-xs mt-0.5">{s.courseName} · {s.unitTitle}</div>
                {s.status === 'rejected' && s.rejectionNote && (
                  <div className="text-red-400/80 text-xs mt-1">Feedback: {s.rejectionNote}</div>
                )}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full border shrink-0 capitalize"
                style={{ color: statusColor[s.status], borderColor: `${statusColor[s.status]}40` }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

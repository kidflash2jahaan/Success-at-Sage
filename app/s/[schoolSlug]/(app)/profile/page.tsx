export const dynamic = 'force-dynamic'

import { requireUser, calculateGrade } from '@/lib/auth'
import { getUserSubmissions } from '@/lib/db/queries/materials'
import Link from 'next/link'

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
      <div className="animate-scale-in glass rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">{user.fullName}</h1>
        <p className="text-white/40 text-sm mt-1">{label} · Class of {user.graduatingYear}</p>
        <p className="text-white/25 text-xs mt-0.5">{user.email}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">
          My Submissions
        </h2>
        <span className="text-xs text-white/25">{submissions.length}</span>
      </div>

      {submissions.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-10 text-center text-white/25 text-sm">
          You haven&apos;t submitted anything yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map((s, i) => (
            <div key={s.id} className="animate-fade-up card-hover glass rounded-xl px-5 py-4 flex items-start justify-between gap-4 transition-all hover:bg-white/[0.06]" style={{ animationDelay: `${0.15 + i * 0.06}s` }}>
              <div className="min-w-0">
                <div className="text-white/90 font-medium text-sm">{s.title}</div>
                <div className="text-white/30 text-xs mt-0.5">{s.courseName} · {s.unitTitle}</div>
                {s.status === 'rejected' && s.rejectionNote && (
                  <div className="text-red-400/70 text-xs mt-1.5">Feedback: {s.rejectionNote}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/profile/edit/${s.id}`}
                  className="text-xs text-white/25 hover:text-white/60 transition-colors"
                >
                  Edit
                </Link>
                <span
                  className="text-xs px-2.5 py-1 rounded-full border capitalize font-medium"
                  style={{ color: statusColor[s.status], borderColor: `${statusColor[s.status]}35` }}
                >
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

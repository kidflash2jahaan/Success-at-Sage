import { db } from '@/lib/db'
import { materials, users } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export default async function AdminDashboardPage() {
  const [pendingResult] = await db.select({ count: count() }).from(materials).where(eq(materials.status, 'pending'))
  const [totalUsers] = await db.select({ count: count() }).from(users)
  const [totalMaterials] = await db.select({ count: count() }).from(materials).where(eq(materials.status, 'approved'))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        {[
          { label: 'Pending Review', value: pendingResult.count, color: '#fbbf24' },
          { label: 'Total Users', value: totalUsers.count, color: '#60a5fa' },
          { label: 'Approved Materials', value: totalMaterials.count, color: '#34d399' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-white/50 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

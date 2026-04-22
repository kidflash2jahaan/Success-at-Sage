export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)

  const [{ count: pendingMaterials }, { count: pendingUnits }, { count: usersCount }, { count: approvedCount }] = await Promise.all([
    supabaseAdmin.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('school_id', tenant.id),
    supabaseAdmin.from('units').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('school_id', tenant.id),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('school_id', tenant.id),
    supabaseAdmin.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'approved').eq('school_id', tenant.id),
  ])
  const pendingCount = (pendingMaterials ?? 0) + (pendingUnits ?? 0)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
      <p className="text-white/40 text-sm mb-8">{tenant.displayShort}</p>
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        {[
          { label: 'Pending Review', value: pendingCount ?? 0, color: '#fbbf24' },
          { label: 'Total Users', value: usersCount ?? 0, color: '#60a5fa' },
          { label: 'Approved Materials', value: approvedCount ?? 0, color: '#34d399' },
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

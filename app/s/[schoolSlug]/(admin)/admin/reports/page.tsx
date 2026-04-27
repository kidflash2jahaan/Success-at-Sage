export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { gateAdmin } from '@/lib/auth'
import { dismissReport, resolveReportAndDeleteMaterial } from '@/app/actions/reports'
import { type MaterialReportStatus } from '@/lib/db/schema'
import SubmitButton from '@/components/ui/SubmitButton'
import { redirect } from 'next/navigation'

type ReportRow = {
  id: string
  reason: string
  status: MaterialReportStatus
  created_at: string
  material_id: string
  materials: { id: string; title: string; type: 'note' | 'test' } | null
  reporter: { full_name: string; email: string } | null
}

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const { tenant } = await gateAdmin(schoolSlug)

  const { data } = await supabaseAdmin
    .from('material_reports')
    .select('id, reason, status, created_at, material_id, materials(id, title, type), reporter:users!reporter_user_id(full_name, email)')
    .eq('school_id', tenant.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100)

  const reports = (data ?? []) as unknown as ReportRow[]

  async function handleDismiss(formData: FormData) {
    'use server'
    const reportId = formData.get('reportId') as string
    await dismissReport(schoolSlug, reportId)
    redirect(`/s/${schoolSlug}/admin/reports`)
  }

  async function handleDelete(formData: FormData) {
    'use server'
    const reportId = formData.get('reportId') as string
    await resolveReportAndDeleteMaterial(schoolSlug, reportId)
    redirect(`/s/${schoolSlug}/admin/reports`)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
      <p className="text-white/40 mb-8">
        {reports.length === 0
          ? 'No pending reports.'
          : `${reports.length} pending report${reports.length === 1 ? '' : 's'} in ${tenant.displayShort}`}
      </p>

      {reports.length > 0 && (
        <div className="max-w-3xl flex flex-col gap-3">
          {reports.map(r => (
            <div key={r.id} className="glass rounded-xl border border-rose-400/15 px-5 py-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm truncate">
                    {r.materials?.title ?? '[material deleted]'}
                    {r.materials && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-white/30 font-medium">
                        {r.materials.type}
                      </span>
                    )}
                  </div>
                  <div className="text-white/35 text-xs mt-0.5">
                    Reported by {r.reporter?.full_name ?? 'Unknown'} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-white/75 text-sm glass-input rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                {r.reason}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <form action={handleDismiss}>
                  <input type="hidden" name="reportId" value={r.id} />
                  <SubmitButton
                    pendingLabel="Dismissing..."
                    className="text-xs bg-white/5 hover:bg-white/[0.08] text-white/70 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Dismiss (not a violation)
                  </SubmitButton>
                </form>

                <form action={handleDelete}>
                  <input type="hidden" name="reportId" value={r.id} />
                  <SubmitButton
                    pendingLabel="Deleting..."
                    className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                  >
                    Delete material
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

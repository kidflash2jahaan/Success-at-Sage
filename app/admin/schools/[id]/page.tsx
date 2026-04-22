export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { approveSchoolRequest, rejectSchoolRequest } from '@/app/actions/superadmin'
import SubmitButton from '@/components/ui/SubmitButton'

export default async function SchoolRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data } = await supabaseAdmin.from('school_requests').select('*').eq('id', id).single()
  if (!data) notFound()
  const r = data as any

  const approve = approveSchoolRequest.bind(null, id)
  const reject = async (formData: FormData) => {
    'use server'
    const note = (formData.get('note') as string) ?? ''
    await rejectSchoolRequest(id, note)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/admin/schools" className="text-white/50 text-sm hover:text-white">← All requests</Link>

      <h1 className="mt-5 mb-2 text-2xl font-bold text-white">{r.proposed_name}</h1>
      <div className="text-white/50 text-sm mb-6">
        /{r.proposed_slug} · <span className="text-white/30">{r.status}</span>
      </div>

      <dl className="space-y-3 glass rounded-2xl p-5 border border-white/5">
        <Row label="Display short" value={r.proposed_display_short} />
        <Row label="Proposed domains" value={(r.proposed_domains ?? []).join(', ')} />
        <Row label="Requester" value={`${r.requester_name} <${r.requester_email}>`} />
        <Row label="Role" value={r.requester_role ?? '—'} />
        <Row label="Notes" value={r.notes ?? '—'} multiline />
        <Row label="Submitted" value={new Date(r.created_at).toLocaleString()} />
        {r.reviewed_at && <Row label="Reviewed" value={new Date(r.reviewed_at).toLocaleString()} />}
        {r.review_note && <Row label="Review note" value={r.review_note} multiline />}
      </dl>

      {r.status === 'pending' && (
        <div className="mt-6 grid grid-cols-1 gap-6">
          <form action={approve}>
            <SubmitButton
              pendingLabel="Approving..."
              className="w-full px-4 py-2.5 rounded-xl bg-green-500/90 disabled:opacity-70 disabled:cursor-wait text-black font-semibold text-sm hover:bg-green-500"
            >
              Approve
            </SubmitButton>
            <p className="text-white/40 text-xs mt-1">
              Creates the school, adds domains, flags requester email so they&apos;ll become admin of the new school on next login.
            </p>
          </form>
          <form action={reject} className="space-y-2">
            <textarea
              name="note"
              rows={3}
              placeholder="Reason for rejection (optional — emailed to requester if configured)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <SubmitButton
              pendingLabel="Rejecting..."
              className="w-full px-4 py-2.5 rounded-xl bg-red-500/80 disabled:opacity-70 disabled:cursor-wait text-white font-semibold text-sm hover:bg-red-500"
            >
              Reject
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <dt className="text-white/40 text-xs uppercase tracking-widest">{label}</dt>
      <dd className={'text-white text-sm mt-0.5 ' + (multiline ? 'whitespace-pre-wrap' : '')}>{value}</dd>
    </div>
  )
}

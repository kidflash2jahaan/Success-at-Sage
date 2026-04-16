export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import SubmissionReviewer from '@/components/admin/SubmissionReviewer'

export default async function SubmissionsPage() {
  const { data } = await supabaseAdmin
    .from('materials')
    .select('id, title, type, content_type, content_json, pdf_path, created_at, users!uploaded_by(full_name, email), units!unit_id(title, courses(name))')
    .eq('status', 'pending')
    .order('created_at')

  const pending = (data ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    contentType: m.content_type,
    contentJson: m.content_json,
    pdfPath: m.pdf_path,
    createdAt: m.created_at,
    uploaderName: m.users?.full_name ?? 'Unknown',
    uploaderEmail: m.users?.email ?? '',
    unitTitle: m.units?.title ?? '',
    courseName: m.units?.courses?.name ?? '',
  }))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Pending Submissions</h1>
      <p className="text-white/40 mb-8">{pending.length} awaiting review</p>
      {pending.length === 0 ? (
        <p className="text-white/30">All caught up!</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl">
          {pending.map(item => <SubmissionReviewer key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

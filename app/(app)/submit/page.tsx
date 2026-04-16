export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import SubmitForm from '@/components/submit/SubmitForm'

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; unit?: string }>
}) {
  await requireUser()
  const { course: preselectedSlug, unit: preselectedUnitId } = await searchParams
  const [{ data: coursesData }, { data: unitsData }] = await Promise.all([
    supabaseAdmin.from('courses').select('id, name, slug').order('name'),
    supabaseAdmin.from('units').select('id, title, course_id').eq('status', 'approved').order('title'),
  ])

  return (
    <SubmitForm
      courses={(coursesData ?? []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))}
      units={(unitsData ?? []).map((u: any) => ({ id: u.id, title: u.title, courseId: u.course_id }))}
      preselectedSlug={preselectedSlug}
      preselectedUnitId={preselectedUnitId}
    />
  )
}

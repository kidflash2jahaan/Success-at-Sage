import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getApprovedMaterialsForUnit(unitId: string) {
  const { data } = await supabaseAdmin
    .from('materials')
    .select('id, title, type, content_type, content_json, pdf_path, link_url, view_count, created_at, users!uploaded_by(full_name)')
    .eq('unit_id', unitId)
    .eq('status', 'approved')
    .order('created_at')
  return (data ?? []).map((m: any) => ({
    id: m.id as string,
    title: m.title as string,
    type: m.type as 'note' | 'test',
    contentType: m.content_type as 'pdf' | 'richtext',
    contentJson: m.content_json,
    pdfPath: m.pdf_path as string | null,
    linkUrl: m.link_url as string | null,
    viewCount: m.view_count as number,
    createdAt: m.created_at as string,
    uploaderName: (m.users?.full_name ?? 'Unknown') as string,
  }))
}

export async function getUserSubmissions(userId: string) {
  const { data } = await supabaseAdmin
    .from('materials')
    .select('id, title, type, status, rejection_note, content_type, content_json, created_at, units(title, courses(name))')
    .eq('uploaded_by', userId)
    .order('created_at')
  return (data ?? []).map((m: any) => ({
    id: m.id as string,
    title: m.title as string,
    type: m.type as string,
    status: m.status as 'pending' | 'approved' | 'rejected',
    rejectionNote: m.rejection_note as string | null,
    contentType: m.content_type as 'pdf' | 'richtext',
    contentJson: m.content_json as { text?: string } | null,
    createdAt: m.created_at as string,
    unitTitle: (m.units?.title ?? '') as string,
    courseName: (m.units?.courses?.name ?? '') as string,
  }))
}

export async function searchContent(query: string) {
  const term = `%${query}%`
  const [{ data: matchedCourses }, { data: matchedMaterials }] = await Promise.all([
    supabaseAdmin
      .from('courses')
      .select('id, name, slug, departments(name, color_accent)')
      .ilike('name', term)
      .limit(5),
    supabaseAdmin
      .from('materials')
      .select('id, title, type, unit_id, units(title, courses(slug, name))')
      .ilike('title', term)
      .eq('status', 'approved')
      .limit(10),
  ])
  return {
    courses: (matchedCourses ?? []).map((c: any) => ({
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      departmentName: (c.departments?.name ?? '') as string,
      colorAccent: (c.departments?.color_accent ?? '') as string,
    })),
    materials: (matchedMaterials ?? []).map((m: any) => ({
      id: m.id as string,
      title: m.title as string,
      type: m.type as string,
      unitId: m.unit_id as string,
      unitTitle: (m.units?.title ?? '') as string,
      courseSlug: (m.units?.courses?.slug ?? '') as string,
      courseName: (m.units?.courses?.name ?? '') as string,
    })),
  }
}

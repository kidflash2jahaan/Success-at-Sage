import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getAllDepartmentsWithCourses() {
  const [{ data }, { data: unitData }, { data: materialData }] = await Promise.all([
    supabaseAdmin.from('departments').select('*, courses(*)'),
    supabaseAdmin.from('units').select('id, course_id').eq('status', 'approved'),
    supabaseAdmin.from('materials').select('id, unit_id').eq('status', 'approved'),
  ])

  // Build lookup maps
  const unitsByCourse: Record<string, Set<string>> = {}
  for (const u of (unitData ?? []) as any[]) {
    if (!unitsByCourse[u.course_id]) unitsByCourse[u.course_id] = new Set()
    unitsByCourse[u.course_id].add(u.id)
  }
  const materialsByUnit: Record<string, number> = {}
  for (const m of (materialData ?? []) as any[]) {
    materialsByUnit[m.unit_id] = (materialsByUnit[m.unit_id] ?? 0) + 1
  }
  const materialsByCourse: Record<string, number> = {}
  for (const [courseId, unitIds] of Object.entries(unitsByCourse)) {
    let count = 0
    for (const uid of unitIds) count += materialsByUnit[uid] ?? 0
    materialsByCourse[courseId] = count
  }

  return (data ?? []).map((d: any) => ({
    id: d.id as string,
    name: d.name as string,
    slug: d.slug as string,
    colorAccent: d.color_accent as string,
    courses: (d.courses ?? []).map((c: any) => ({
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      description: c.description as string,
      departmentId: c.department_id as string,
      unitCount: unitsByCourse[c.id]?.size ?? 0,
      materialCount: materialsByCourse[c.id] ?? 0,
    })),
  }))
}

export async function getCourseWithUnits(slug: string) {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('*, departments(*), units(*)')
    .eq('slug', slug)
    .single()
  if (!data) return null
  const dept = data.departments as any
  const approvedUnits = ((data.units as any[]) ?? []).filter((u: any) => u.status === 'approved')

  // Fetch approved material counts per unit for this course
  const unitIds = approvedUnits.map((u: any) => u.id)
  const { data: materialData } = unitIds.length
    ? await supabaseAdmin.from('materials').select('id, unit_id').eq('status', 'approved').in('unit_id', unitIds)
    : { data: [] }

  const materialCountByUnit: Record<string, number> = {}
  for (const m of (materialData ?? []) as any[]) {
    materialCountByUnit[m.unit_id] = (materialCountByUnit[m.unit_id] ?? 0) + 1
  }

  const units = approvedUnits
    .map((u: any) => ({
      id: u.id as string,
      title: u.title as string,
      courseId: u.course_id as string,
      materialCount: materialCountByUnit[u.id] ?? 0,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))

  const totalMaterials = units.reduce((sum, u) => sum + u.materialCount, 0)

  return {
    course: {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      description: data.description as string,
      departmentId: data.department_id as string,
    },
    department: {
      id: dept.id as string,
      name: dept.name as string,
      slug: dept.slug as string,
      colorAccent: dept.color_accent as string,
    },
    units,
    totalMaterials,
  }
}

export async function isUserEnrolled(userId: string, courseId: string) {
  const { data } = await supabaseAdmin
    .from('user_courses')
    .select('user_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()
  return !!data
}

export async function getUserCourses(userId: string, schoolId?: string) {
  // When schoolId is supplied, only return enrollments where the user's
  // course belongs to that tenant. Keeps student dashboards clean when a
  // user (or superadmin) views a tenant they're not enrolled in — shows
  // empty state instead of leaking enrollments from another school.
  let userCoursesQuery = supabaseAdmin
    .from('user_courses')
    .select('courses(id, name, slug, description, department_id, departments(id, name, slug, color_accent))')
    .eq('user_id', userId)
  if (schoolId) userCoursesQuery = userCoursesQuery.eq('school_id', schoolId)

  const [{ data }, { data: unitData }, { data: materialData }] = await Promise.all([
    userCoursesQuery,
    supabaseAdmin.from('units').select('id, course_id').eq('status', 'approved'),
    supabaseAdmin.from('materials').select('id, unit_id').eq('status', 'approved'),
  ])

  const unitsByCourse: Record<string, Set<string>> = {}
  for (const u of (unitData ?? []) as any[]) {
    if (!unitsByCourse[u.course_id]) unitsByCourse[u.course_id] = new Set()
    unitsByCourse[u.course_id].add(u.id)
  }
  const materialsByUnit: Record<string, number> = {}
  for (const m of (materialData ?? []) as any[]) {
    materialsByUnit[m.unit_id] = (materialsByUnit[m.unit_id] ?? 0) + 1
  }
  const materialsByCourse: Record<string, number> = {}
  for (const [courseId, unitIds] of Object.entries(unitsByCourse)) {
    let count = 0
    for (const uid of unitIds) count += materialsByUnit[uid] ?? 0
    materialsByCourse[courseId] = count
  }

  return (data ?? []).map((row: any) => {
    const c = row.courses
    const d = c.departments
    return {
      course: {
        id: c.id as string,
        name: c.name as string,
        slug: c.slug as string,
        description: c.description as string,
        departmentId: c.department_id as string,
        unitCount: unitsByCourse[c.id]?.size ?? 0,
        materialCount: materialsByCourse[c.id] ?? 0,
      },
      department: {
        id: d.id as string,
        name: d.name as string,
        slug: d.slug as string,
        colorAccent: d.color_accent as string,
      },
    }
  })
}

import { supabaseAdmin } from '@/lib/supabase/admin'

type UnitIdRow = { id: string; course_id: string }
type MaterialUnitRow = { id: string; unit_id: string }

/**
 * Aggregate approved unit and material counts per course, scoped to one
 * tenant. Two pages need these numbers (browse/dashboard), so the tiny
 * grouping helper lives here to keep the queries themselves DRY.
 */
async function approvedCountsForTenant(schoolId: string): Promise<{
  unitCountByCourse: Record<string, number>
  materialCountByCourse: Record<string, number>
}> {
  const [{ data: units }, { data: materials }] = await Promise.all([
    supabaseAdmin
      .from('units')
      .select('id, course_id')
      .eq('status', 'approved')
      .eq('school_id', schoolId)
      .returns<UnitIdRow[]>(),
    supabaseAdmin
      .from('materials')
      .select('id, unit_id')
      .eq('status', 'approved')
      .eq('school_id', schoolId)
      .returns<MaterialUnitRow[]>(),
  ])

  const unitsByCourse: Record<string, Set<string>> = {}
  for (const u of units ?? []) {
    ;(unitsByCourse[u.course_id] ??= new Set()).add(u.id)
  }
  const materialsByUnit: Record<string, number> = {}
  for (const m of materials ?? []) {
    materialsByUnit[m.unit_id] = (materialsByUnit[m.unit_id] ?? 0) + 1
  }
  const unitCountByCourse: Record<string, number> = {}
  const materialCountByCourse: Record<string, number> = {}
  for (const [courseId, unitIds] of Object.entries(unitsByCourse)) {
    unitCountByCourse[courseId] = unitIds.size
    let count = 0
    for (const uid of unitIds) count += materialsByUnit[uid] ?? 0
    materialCountByCourse[courseId] = count
  }
  return { unitCountByCourse, materialCountByCourse }
}

// Supabase embeds related rows with the foreign table name as the key.
type DepartmentWithCoursesRow = {
  id: string
  name: string
  slug: string
  color_accent: string
  courses: {
    id: string
    name: string
    slug: string
    description: string
    department_id: string
    school_id: string
  }[] | null
}

/**
 * All departments + their courses for ONE tenant.
 *
 * Every department, course, unit, and material row carries a `school_id`
 * (migration 0003). Filtering here is what keeps a Sage student from
 * seeing Oakwood's course catalog, even though the underlying tables are
 * shared.
 */
export async function getAllDepartmentsWithCourses(schoolId: string) {
  const [{ data: departments }, counts] = await Promise.all([
    supabaseAdmin
      .from('departments')
      .select('id, name, slug, color_accent, courses(id, name, slug, description, department_id, school_id)')
      .eq('school_id', schoolId)
      .returns<DepartmentWithCoursesRow[]>(),
    approvedCountsForTenant(schoolId),
  ])

  return (departments ?? []).map(d => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    colorAccent: d.color_accent,
    // Supabase joins don't filter the embedded list by school_id — do it
    // client-side so a mis-seeded row can't leak cross-tenant.
    courses: (d.courses ?? [])
      .filter(c => c.school_id === schoolId)
      .map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        departmentId: c.department_id,
        unitCount: counts.unitCountByCourse[c.id] ?? 0,
        materialCount: counts.materialCountByCourse[c.id] ?? 0,
      })),
  }))
}

type CourseWithUnitsRow = {
  id: string
  name: string
  slug: string
  description: string
  department_id: string
  departments: {
    id: string
    name: string
    slug: string
    color_accent: string
  } | null
  units: {
    id: string
    title: string
    course_id: string
    status: 'pending' | 'approved' | 'rejected'
  }[] | null
}

/**
 * Course detail by slug, scoped to a tenant.
 *
 * Courses are scoped by school_id, so the tenant id is required to
 * disambiguate between e.g. Sage's "ap-calc-bc" and Oakwood's
 * "ap-calc-bc" once a second tenant is live.
 */
export async function getCourseWithUnits(schoolId: string, slug: string) {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('id, name, slug, description, department_id, departments(id, name, slug, color_accent), units(id, title, course_id, status)')
    .eq('school_id', schoolId)
    .eq('slug', slug)
    .single<CourseWithUnitsRow>()
  if (!data || !data.departments) return null
  const dept = data.departments
  const approvedUnits = (data.units ?? []).filter(u => u.status === 'approved')

  // Fetch approved material counts per unit for this course
  const unitIds = approvedUnits.map(u => u.id)
  const { data: materialData } = unitIds.length
    ? await supabaseAdmin
        .from('materials')
        .select('id, unit_id')
        .eq('status', 'approved')
        .in('unit_id', unitIds)
        .returns<MaterialUnitRow[]>()
    : { data: [] as MaterialUnitRow[] }

  const materialCountByUnit: Record<string, number> = {}
  for (const m of materialData ?? []) {
    materialCountByUnit[m.unit_id] = (materialCountByUnit[m.unit_id] ?? 0) + 1
  }

  const units = approvedUnits
    .map(u => ({
      id: u.id,
      title: u.title,
      courseId: u.course_id,
      materialCount: materialCountByUnit[u.id] ?? 0,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))

  const totalMaterials = units.reduce((sum, u) => sum + u.materialCount, 0)

  return {
    course: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      departmentId: data.department_id,
    },
    department: {
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      colorAccent: dept.color_accent,
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

type UserCourseRow = {
  courses: {
    id: string
    name: string
    slug: string
    description: string
    department_id: string
    departments: {
      id: string
      name: string
      slug: string
      color_accent: string
    } | null
  } | null
}

/**
 * Enrolled courses for a user, scoped to one tenant.
 *
 * Scoping by school_id keeps a superadmin viewing another tenant from
 * seeing their own enrollments from a different school bleed through.
 */
export async function getUserCourses(userId: string, schoolId: string) {
  const [{ data: rows }, counts] = await Promise.all([
    supabaseAdmin
      .from('user_courses')
      .select('courses(id, name, slug, description, department_id, departments(id, name, slug, color_accent))')
      .eq('user_id', userId)
      .eq('school_id', schoolId)
      .returns<UserCourseRow[]>(),
    approvedCountsForTenant(schoolId),
  ])

  return (rows ?? [])
    .filter((row): row is UserCourseRow & { courses: NonNullable<UserCourseRow['courses']> } =>
      row.courses !== null && row.courses.departments !== null,
    )
    .map(row => {
      const c = row.courses
      const d = c.departments!
      return {
        course: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          departmentId: c.department_id,
          unitCount: counts.unitCountByCourse[c.id] ?? 0,
          materialCount: counts.materialCountByCourse[c.id] ?? 0,
        },
        department: {
          id: d.id,
          name: d.name,
          slug: d.slug,
          colorAccent: d.color_accent,
        },
      }
    })
}

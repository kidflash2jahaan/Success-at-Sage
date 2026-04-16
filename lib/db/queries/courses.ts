import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getAllDepartmentsWithCourses() {
  const { data } = await supabaseAdmin
    .from('departments')
    .select('*, courses(*)')
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
    })),
  }))
}

export async function getCourseBySlug(slug: string) {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()
  if (!data) return null
  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    description: data.description as string,
    departmentId: data.department_id as string,
  }
}

export async function getCourseWithUnits(slug: string) {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('*, departments(*), units(*)')
    .eq('slug', slug)
    .single()
  if (!data) return null
  const dept = data.departments as any
  const units = ((data.units as any[]) ?? [])
    .map((u: any) => ({
      id: u.id as string,
      title: u.title as string,
      courseId: u.course_id as string,
      orderIndex: u.order_index as number,
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex)
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

export async function getUserCourses(userId: string) {
  const { data } = await supabaseAdmin
    .from('user_courses')
    .select('courses(id, name, slug, description, department_id, departments(id, name, slug, color_accent))')
    .eq('user_id', userId)
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

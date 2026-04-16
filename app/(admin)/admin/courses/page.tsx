export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import AdminCourseCard from '@/components/admin/AdminCourseCard'

export default async function AdminCoursesPage() {
  const [{ data: depsData }, { data: coursesData }, { data: unitsData }] = await Promise.all([
    supabaseAdmin.from('departments').select('id, name, color_accent'),
    supabaseAdmin.from('courses').select('id, name, department_id').order('name'),
    supabaseAdmin.from('units').select('id, title, course_id, order_index')
      .eq('status', 'approved').order('order_index'),
  ])

  const depsWithCourses = (depsData ?? []).map((d: any) => ({
    ...d,
    courses: (coursesData ?? [])
      .filter((c: any) => c.department_id === d.id)
      .map((c: any) => ({
        ...c,
        units: (unitsData ?? []).filter((u: any) => u.course_id === c.id),
      })),
  }))

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-8">Course Management</h1>
      {depsWithCourses.map((dept: any) => (
        <div key={dept.id} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: dept.color_accent }} />
            <h2 className="text-base font-semibold text-white">{dept.name}</h2>
          </div>
          {dept.courses.map((course: any) => (
            <AdminCourseCard
              key={course.id}
              courseId={course.id}
              courseName={course.name}
              units={course.units.map((u: any) => ({ id: u.id, title: u.title, orderIndex: u.order_index }))}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

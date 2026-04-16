export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { departments, courses, units } from '@/lib/db/schema'
import { createUnit, deleteUnit } from '@/app/actions/admin'

export default async function AdminCoursesPage() {
  const deps = await db.select().from(departments)
  const allCourses = await db.select().from(courses).orderBy(courses.name)
  const allUnits = await db.select().from(units).orderBy(units.orderIndex)

  const depsWithCourses = deps.map(d => ({
    ...d,
    courses: allCourses
      .filter(c => c.departmentId === d.id)
      .map(c => ({
        ...c,
        units: allUnits.filter(u => u.courseId === c.id),
      })),
  }))

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-8">Course Management</h1>
      {depsWithCourses.map(dept => (
        <div key={dept.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: dept.colorAccent }} />
            <h2 className="text-lg font-semibold text-white">{dept.name}</h2>
          </div>
          {dept.courses.map(course => (
            <div key={course.id} className="mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white font-medium mb-3">{course.name}</div>
              <div className="flex flex-col gap-1 mb-3">
                {course.units.map(unit => (
                  <div key={unit.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-white/70 text-sm">{unit.title}</span>
                    <form action={deleteUnit.bind(null, unit.id)}>
                      <button type="submit" className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
                    </form>
                  </div>
                ))}
              </div>
              <form action={async (formData: FormData) => {
                'use server'
                const title = formData.get('title') as string
                if (title) await createUnit(course.id, title, course.units.length + 1)
              }} className="flex gap-2">
                <input name="title" placeholder="New unit title..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
                <button type="submit" className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors">Add</button>
              </form>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

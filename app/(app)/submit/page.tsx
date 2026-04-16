import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { courses, units } from '@/lib/db/schema'
import SubmitForm from '@/components/submit/SubmitForm'

export default async function SubmitPage() {
  await requireUser()
  const allCourses = await db.select().from(courses).orderBy(courses.name)
  const allUnits = await db.select().from(units).orderBy(units.orderIndex)

  return (
    <SubmitForm
      courses={allCourses.map(c => ({ id: c.id, name: c.name }))}
      units={allUnits.map(u => ({ id: u.id, title: u.title, courseId: u.courseId }))}
    />
  )
}

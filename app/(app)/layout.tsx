import { requireUser } from '@/lib/auth'
import { getUserCourses } from '@/lib/db/queries/courses'
import DashboardShell from '@/components/DashboardShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const userCourses = await getUserCourses(user.id)

  const courses = userCourses.map(({ course, department }) => ({
    id: course.id,
    name: course.name,
    slug: course.slug,
    department: { colorAccent: department.colorAccent, name: department.name },
  }))

  return (
    <DashboardShell courses={courses} userName={user.fullName}>
      {children}
    </DashboardShell>
  )
}

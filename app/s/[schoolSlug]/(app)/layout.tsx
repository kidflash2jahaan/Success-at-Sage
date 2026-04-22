import { requireUser } from '@/lib/auth'
import { getUserCourses } from '@/lib/db/queries/courses'
import { resolveTenantBySlug } from '@/lib/tenant'
import DashboardShell from '@/components/DashboardShell'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const user = await requireUser()
  const userCourses = await getUserCourses(user.id, tenant.id)

  const courses = userCourses.map(({ course, department }) => ({
    id: course.id,
    name: course.name,
    slug: course.slug,
    department: { colorAccent: department.colorAccent, name: department.name },
  }))

  return (
    <DashboardShell
      schoolSlug={schoolSlug}
      displayShort={tenant.displayShort}
      courses={courses}
      userName={user.fullName}
      isAdmin={user.role === 'admin'}
    >
      {children}
    </DashboardShell>
  )
}

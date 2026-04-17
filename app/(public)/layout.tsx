import { getCurrentUser } from '@/lib/auth'
import { getUserCourses } from '@/lib/db/queries/courses'
import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (user) {
    const userCourses = await getUserCourses(user.id)
    const courses = userCourses.map(({ course, department }) => ({
      id: course.id,
      name: course.name,
      slug: course.slug,
      department: { colorAccent: department.colorAccent, name: department.name },
    }))
    return (
      <DashboardShell courses={courses} userName={user.fullName} isAdmin={user.role === 'admin'}>
        {children}
      </DashboardShell>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <header
        className="glass-nav flex items-center px-4 gap-4 shrink-0 sticky top-0 z-10"
        style={{ height: '56px', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Link href="/" className="font-bold text-white text-base tracking-tight">
          Success at Sage
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Get started
          </Link>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

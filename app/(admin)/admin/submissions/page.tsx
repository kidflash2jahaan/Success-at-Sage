export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { materials, users, units, courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SubmissionReviewer from '@/components/admin/SubmissionReviewer'

export default async function SubmissionsPage() {
  const pending = await db.select({
    id: materials.id,
    title: materials.title,
    type: materials.type,
    contentType: materials.contentType,
    contentJson: materials.contentJson,
    pdfPath: materials.pdfPath,
    createdAt: materials.createdAt,
    uploaderName: users.fullName,
    uploaderEmail: users.email,
    unitTitle: units.title,
    courseName: courses.name,
  })
    .from(materials)
    .innerJoin(users, eq(materials.uploadedBy, users.id))
    .innerJoin(units, eq(materials.unitId, units.id))
    .innerJoin(courses, eq(units.courseId, courses.id))
    .where(eq(materials.status, 'pending'))
    .orderBy(materials.createdAt)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Pending Submissions</h1>
      <p className="text-white/40 mb-8">{pending.length} awaiting review</p>
      {pending.length === 0 ? (
        <p className="text-white/30">All caught up!</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl">
          {pending.map(item => <SubmissionReviewer key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

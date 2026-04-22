'use server'
import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUserSchoolId } from '@/lib/tenant-for-user'
import { revalidatePath } from 'next/cache'

export async function addCourseToSchedule(courseId: string) {
  const user = await requireUser()
  const schoolId = await getUserSchoolId(user.id)
  await supabaseAdmin
    .from('user_courses')
    .insert({ school_id: schoolId, user_id: user.id, course_id: courseId })
  revalidatePath('/s/[schoolSlug]/dashboard', 'page')
  revalidatePath('/s/[schoolSlug]/browse', 'page')
}

export async function removeCourseFromSchedule(courseId: string) {
  const user = await requireUser()
  await supabaseAdmin
    .from('user_courses')
    .delete()
    .eq('user_id', user.id)
    .eq('course_id', courseId)
  revalidatePath('/s/[schoolSlug]/dashboard', 'page')
}

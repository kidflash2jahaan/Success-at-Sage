'use server'
import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addCourseToSchedule(courseId: string) {
  const user = await requireUser()
  await supabaseAdmin
    .from('user_courses')
    .insert({ user_id: user.id, course_id: courseId })
  revalidatePath('/dashboard')
  revalidatePath('/courses')
}

export async function removeCourseFromSchedule(courseId: string) {
  const user = await requireUser()
  await supabaseAdmin
    .from('user_courses')
    .delete()
    .eq('user_id', user.id)
    .eq('course_id', courseId)
  revalidatePath('/dashboard')
}

'use server'
import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

export async function addCourseToSchedule(schoolSlug: string, courseId: string) {
  const user = await requireUser()
  const tenant = await resolveTenantBySlug(schoolSlug)
  await supabaseAdmin
    .from('user_courses')
    .insert({ school_id: tenant.id, user_id: user.id, course_id: courseId })
  revalidatePath('/s/[schoolSlug]/dashboard', 'page')
  revalidatePath('/s/[schoolSlug]/browse', 'page')
}

export async function removeCourseFromSchedule(schoolSlug: string, courseId: string) {
  const user = await requireUser()
  const tenant = await resolveTenantBySlug(schoolSlug)
  await supabaseAdmin
    .from('user_courses')
    .delete()
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/dashboard', 'page')
}

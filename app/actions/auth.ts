'use server'
import { getUser } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  const role = adminEmails.includes(authUser.email ?? '') ? 'admin' as const : 'student' as const

  await db.insert(users).values({
    id: authUser.id,
    email: authUser.email!,
    fullName,
    graduatingYear,
    role,
  })

  redirect('/dashboard')
}

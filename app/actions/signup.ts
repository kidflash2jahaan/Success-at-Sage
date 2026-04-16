'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { redirect } from 'next/navigation'

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) redirect('/signup?error=taken')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  const role = adminEmails.includes(email) ? 'admin' as const : 'student' as const

  await db.insert(users).values({
    id: data.user!.id,
    email,
    fullName,
    graduatingYear,
    role,
  })

  redirect('/dashboard')
}

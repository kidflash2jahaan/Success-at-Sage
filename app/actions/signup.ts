'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function signUpWithEmail(formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = adminEmails.includes(email)

  // Restrict signups to Sage Hill students (by email domain) unless the
  // address is on the admin allowlist in ADMIN_EMAILS.
  if (!email.endsWith('@sagehillschool.org') && !isAdmin) {
    redirect('/signup?error=domain')
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) redirect('/signup?error=taken')

  const role = isAdmin ? 'admin' as const : 'student' as const

  await supabaseAdmin.from('users').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    graduating_year: graduatingYear,
    role,
  })

  redirect('/onboarding')
}

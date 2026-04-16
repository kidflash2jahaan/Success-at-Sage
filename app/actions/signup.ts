'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
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

  await supabaseAdmin.from('users').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    graduating_year: graduatingYear,
    role,
  })

  redirect('/signup?sent=1')
}

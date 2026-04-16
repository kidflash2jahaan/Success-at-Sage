'use server'
import { getUser } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  const role = adminEmails.includes(authUser.email ?? '') ? 'admin' as const : 'student' as const

  await supabaseAdmin.from('users').insert({
    id: authUser.id,
    email: authUser.email!,
    full_name: fullName,
    graduating_year: graduatingYear,
    role,
  })

  redirect('/dashboard')
}

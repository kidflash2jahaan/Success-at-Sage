'use server'
import { getUser } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SAGE_SCHOOL_ID } from '@/lib/constants'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)
  const email = (authUser.email ?? '').trim().toLowerCase()

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const role = adminEmails.includes(email) ? 'admin' as const : 'student' as const

  // Use upsert so this is idempotent — /signup eagerly creates the user row
  // for email+password signups, but the /auth/callback path routes through
  // /onboarding when no row exists yet. A race (or repeat submit) shouldn't
  // crash on a primary-key conflict.
  await supabaseAdmin.from('users').upsert({
    id: authUser.id,
    school_id: SAGE_SCHOOL_ID,
    email,
    full_name: fullName,
    graduating_year: graduatingYear,
    role,
  }, { onConflict: 'id' })

  redirect('/dashboard')
}

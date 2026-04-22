'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resolveTenantByEmail } from '@/lib/tenant'
import { redirect } from 'next/navigation'

export async function signInWithEmail(formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = formData.get('password') as string
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=invalid')

  // Route to the user's tenant dashboard. Fall back to root if unknown —
  // the root redirect-landing handles that case (sends to /s/sage/).
  const tenant = await resolveTenantByEmail(email)
  if (tenant) redirect(`/s/${tenant.slug}/dashboard`)
  redirect('/')
}
